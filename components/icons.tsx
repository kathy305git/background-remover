import React from 'react';

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0A2.25 2.25 0 013.75 7.5h16.5a2.25 2.25 0 012.25 2.25m-18.75 0h18.75v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75z" />
  </svg>
);

export const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25278V6.25278C12 6.94191 12.5581 7.5 13.2472 7.5V7.5C13.9364 7.5 14.4945 6.94191 14.4945 6.25278V6.25278C14.4945 5.56364 13.9364 5 13.2472 5V5C12.5581 5 12 5.56364 12 6.25278Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 4.5V4.5C9.5 5.05228 9.94772 5.5 10.5 5.5V5.5C11.0523 5.5 11.5 5.05228 11.5 4.5V4.5C11.5 3.94772 11.0523 3.5 10.5 3.5V3.5C9.94772 3.5 9.5 3.94772 9.5 4.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5V12.5C5 13.0523 5.44772 13.5 6 13.5V13.5C6.55228 13.5 7 13.0523 7 12.5V12.5C7 11.9477 6.55228 11.5 6 11.5V11.5C5.44772 11.5 5 11.9477 5 12.5Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.52513 4.58579L19.4142 20.4749C20.2 21.2591 21.4695 21.2562 22.2506 20.4682L22.4682 20.2506C23.2562 19.4695 23.2591 18.2 22.4749 17.4142L6.58579 1.52513C5.79958 0.738918 4.52834 0.736944 3.74413 1.52115L3.52115 1.74413C2.73694 2.52834 2.73892 3.79958 3.52513 4.58579Z" />
  </svg>
);

export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);