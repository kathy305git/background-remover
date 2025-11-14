import React, { useState, useCallback, ChangeEvent } from 'react';
import { editImageWithGemini } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, MagicWandIcon, ImageIcon, CloseIcon, FolderIcon, DownloadIcon } from './components/icons';

// Allow TypeScript to recognize JSZip from the CDN
declare var JSZip: any;

// Type definitions
type ImageFile = {
  file: File;
  dataUrl: string;
};

type ProcessedImage = {
  originalName: string;
  dataUrl: string;
};

type AppMode = 'single' | 'batch';

// --- Reusable Components ---

const LoadingSpinner: React.FC<{ progress?: { current: number; total: number } }> = ({ progress }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
    <p className="mt-4 text-lg font-semibold text-white">
      {progress ? `Processing ${progress.current} of ${progress.total}...` : 'Nano Banana is working its magic...'}
    </p>
  </div>
);

const ImageDisplay: React.FC<{ title: string; imageUrl?: string | null }> = ({ title, imageUrl }) => (
  <div className="w-full h-full bg-gray-800 rounded-2xl flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-700">
    <h3 className="text-lg font-semibold text-gray-400 mb-4">{title}</h3>
    <div className="flex-grow flex items-center justify-center w-full">
      {imageUrl ? (
        <img src={imageUrl} alt={title} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
      ) : (
        <div className="text-gray-500">
          <ImageIcon className="w-24 h-24 mx-auto" />
          <p className="mt-2 text-center">Your generated image will appear here.</p>
        </div>
      )}
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  // --- State Management ---
  const [mode, setMode] = useState<AppMode>('single');
  const [error, setError] = useState<string | null>(null);

  // Single mode state
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Batch mode state
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  // --- Single Mode Handlers ---
  const handleSingleImageUpload = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToBase64(file);
        setOriginalImage({ file, dataUrl });
        setEditedImage(null);
        setError(null);
        setPrompt('');
      } catch (err) {
        setError('Could not process the selected file.');
      }
    } else {
      setError('Please select a valid image file.');
    }
  };
  
  const handleSingleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSingleImageUpload(e.target.files[0]);
    }
  };

  const onSingleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSingleImageUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleSingleSubmit = async () => {
    if (!originalImage || !prompt) {
      setError('Please upload an image and provide an editing prompt.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const result = await editImageWithGemini(originalImage.dataUrl, originalImage.file.type, prompt);
      setEditedImage(result);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleReset = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
  }
  
  const handleDownloadSingleImage = () => {
    if (!editedImage || !originalImage) return;

    // Determine the file extension from the mime type in the data URL
    const mimeType = editedImage.substring(editedImage.indexOf(':') + 1, editedImage.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'png';

    const originalName = originalImage.file.name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const newName = `${nameWithoutExt}_edited.${extension}`;

    const a = document.createElement('a');
    a.href = editedImage;
    a.download = newName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  // --- Batch Mode Handlers ---
  const handleBatchFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setBatchFiles(Array.from(e.target.files));
        setProcessedImages([]);
        setBatchErrors([]);
    }
  };
  
  const onBatchDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setBatchFiles(Array.from(e.dataTransfer.files));
        setProcessedImages([]);
        setBatchErrors([]);
    }
  };
  
  const handleBatchSubmit = async () => {
    if (batchFiles.length === 0) {
        setError('Please upload images for batch processing.');
        return;
    }
    setIsBatchProcessing(true);
    setError(null);
    setBatchErrors([]);
    setProcessedImages([]);
    setBatchProgress({ current: 0, total: batchFiles.length });

    const newProcessed: ProcessedImage[] = [];
    const newErrors: string[] = [];
    
    const backgroundRemovalPrompt = "Isolate the main subject and remove the background. The output must be a PNG with a transparent alpha channel. Do not add any color to the background.";

    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        setBatchProgress({ current: i + 1, total: batchFiles.length });
        try {
            const base64 = await fileToBase64(file);
            const result = await editImageWithGemini(base64, file.type, backgroundRemovalPrompt);
            newProcessed.push({ originalName: file.name, dataUrl: result });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            newErrors.push(`Failed to process ${file.name}: ${msg}`);
        }
    }
    
    setProcessedImages(newProcessed);
    setBatchErrors(newErrors);
    setIsBatchProcessing(false);
  };
  
  const handleDownloadZip = async () => {
    if (processedImages.length === 0) return;
    const zip = new JSZip();
    processedImages.forEach(image => {
        const base64Data = image.dataUrl.split(',')[1];
        const originalName = image.originalName;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        const mimeType = image.dataUrl.substring(image.dataUrl.indexOf(':') + 1, image.dataUrl.indexOf(';'));
        const extension = mimeType.split('/')[1] || 'png';
        const newName = `${nameWithoutExt}_no_bg.${extension}`; 
        zip.file(newName, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nano_banana_processed.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBatchReset = () => {
    setBatchFiles([]);
    setProcessedImages([]);
    setBatchErrors([]);
    setError(null);
  };
  
  const backgroundRemovalPrompt = "Isolate the main subject and remove the background. The output must be a PNG with a transparent alpha channel. Do not add any color to the background.";
  const quickPrompts = [backgroundRemovalPrompt, "Add a retro filter", "Make it black and white", "Increase the contrast", "Add a soft blur to the background"];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 sm:p-6 lg:p-8">
      {(isProcessing || isBatchProcessing) && <LoadingSpinner progress={isBatchProcessing ? batchProgress : undefined} />}

      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Nano Banana by TechieMom
        </h1>
        <p className="mt-2 text-lg text-gray-400">Edit your images with the power of Gemini 2.5 Flash Image</p>
      </header>

      {error && (
        <div className="max-w-4xl mx-auto w-full bg-red-800 border border-red-600 text-red-100 px-4 py-3 rounded-lg relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3"><CloseIcon className="w-5 h-5"/></button>
        </div>
      )}

      <main className="flex-grow flex flex-col items-center w-full">
        {/* --- Mode Tabs --- */}
        <div className="mb-8 flex items-center justify-center p-1 rounded-lg bg-gray-800 border border-gray-700">
            <button onClick={() => setMode('single')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'single' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Single Image</button>
            <button onClick={() => setMode('batch')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'batch' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Batch Background Removal</button>
        </div>

        {/* --- Single Image Mode View --- */}
        {mode === 'single' && (
          !originalImage ? (
            <div 
              className="w-full max-w-2xl h-80 rounded-2xl border-4 border-dashed border-gray-700 flex flex-col justify-center items-center text-center p-8 cursor-pointer hover:border-purple-500 hover:bg-gray-800/50 transition-all duration-300"
              onDragOver={onDragOver}
              onDrop={onSingleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadIcon className="w-16 h-16 text-gray-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Upload Your Image</h2>
              <p className="text-gray-400">Click to browse or drag and drop an image file here</p>
              <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleSingleFileChange} />
            </div>
          ) : (
            <div className="w-full max-w-7xl flex flex-col items-start gap-8">
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-6">
                    <ImageDisplay title="Original" imageUrl={originalImage.dataUrl} />
                    <button onClick={handleSingleReset} className="w-full sm:w-auto self-start bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Upload a Different Image</button>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex-grow">
                        <ImageDisplay title="Edited" imageUrl={editedImage} />
                    </div>
                    {editedImage && (
                        <button 
                            onClick={handleDownloadSingleImage} 
                            className="w-full sm:w-auto self-start bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <DownloadIcon className="w-5 h-5" />
                            <span>Download Image</span>
                        </button>
                    )}
                </div>
              </div>
              <div className="w-full bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <label htmlFor="prompt" className="block text-xl font-semibold mb-3">Your Editing Command</label>
                <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Add a talking squirrel wearing a tiny hat'" className="w-full h-24 p-3 bg-gray-900 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-white placeholder-gray-500"/>
                <div className="mt-4 flex flex-wrap gap-2"><span className="text-gray-400 self-center mr-2">Quick actions:</span>{quickPrompts.map(p => (<button key={p} onClick={() => setPrompt(p)} className="px-3 py-1 bg-gray-700 text-sm rounded-full hover:bg-purple-600 transition-colors">{p}</button>))}</div>
                <button onClick={handleSingleSubmit} disabled={isProcessing || !prompt} className="mt-6 w-full flex items-center justify-center gap-3 text-lg font-bold py-4 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105">
                  <MagicWandIcon className="w-6 h-6" />Generate</button>
              </div>
            </div>
          )
        )}
        
        {/* --- Batch Processing Mode View --- */}
        {mode === 'batch' && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-8">
            {batchFiles.length === 0 ? (
                <div
                    className="w-full h-80 rounded-2xl border-4 border-dashed border-gray-700 flex flex-col justify-center items-center text-center p-8 cursor-pointer hover:border-purple-500 hover:bg-gray-800/50 transition-all duration-300"
                    onDragOver={onDragOver}
                    onDrop={onBatchDrop}
                    onClick={() => document.getElementById('batch-file-upload')?.click()}
                >
                    <FolderIcon className="w-16 h-16 text-gray-500 mb-4" />
                    <h2 className="text-2xl font-semibold mb-2">Upload Your Images</h2>
                    <p className="text-gray-400">Click to browse or drag and drop multiple image files</p>
                    <input type="file" id="batch-file-upload" className="hidden" accept="image/*" multiple onChange={handleBatchFileChange} />
                </div>
            ) : (
                <div className="w-full bg-gray-800 p-6 rounded-2xl border border-gray-700">
                    <h2 className="text-2xl font-semibold mb-4">Files Ready for Processing</h2>
                    <div className="max-h-60 overflow-y-auto bg-gray-900 p-3 rounded-lg border border-gray-600 mb-4">
                        <ul className="space-y-1">
                            {batchFiles.map((file, index) => <li key={index} className="text-sm text-gray-300 truncate">{file.name}</li>)}
                        </ul>
                    </div>

                    {processedImages.length === 0 ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleBatchSubmit} disabled={isBatchProcessing} className="flex-1 flex items-center justify-center gap-3 text-lg font-bold py-4 px-6 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all">
                                <MagicWandIcon className="w-6 h-6" /> Start Processing ({batchFiles.length} images)
                            </button>
                             <button onClick={handleBatchReset} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Clear Selection</button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <h3 className="text-xl font-semibold text-green-400 mb-2">Processing Complete!</h3>
                            <p className="text-gray-300 mb-4">{processedImages.length} of {batchFiles.length} images successfully processed.</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button onClick={handleDownloadZip} className="flex-1 flex items-center justify-center gap-3 text-lg font-bold py-4 px-6 rounded-lg bg-green-600 hover:bg-green-700 transition-colors">
                                    <DownloadIcon className="w-6 h-6" /> Download All as ZIP
                                </button>
                                <button onClick={handleBatchReset} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Start New Batch</button>
                            </div>
                        </div>
                    )}
                    
                    {batchErrors.length > 0 && (
                        <div className="mt-6 bg-red-900/50 border border-red-700 p-4 rounded-lg">
                            <h4 className="font-bold text-red-300 mb-2">Processing Errors:</h4>
                            <ul className="text-sm text-red-200 list-disc list-inside max-h-32 overflow-y-auto">
                                {batchErrors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;