import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function FileUpload() {
  const [uploadStatus, setUploadStatus] = useState('Drop files here or click to upload.');

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]; // Assuming you only upload one file
  
    const formData = new FormData();
    formData.append('file', file);
  
    // Replace "localhost:3001" with your server's address and port
    fetch('http://localhost:3003/upload', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.text())
    .then(data => {
      setUploadStatus('Upload Complete');
      console.log(data); // Handle the server response
    })
    .catch(error => {
      console.error(error);
      setUploadStatus('Upload Failed');
    });
  }, []);
    
//   const onDrop = useCallback((acceptedFiles) => {
//     // Handle file processing/uploading here
//     console.log(acceptedFiles);

//     // Simulate file upload progress
//     setUploadStatus('Upload in Progress...');
//     setTimeout(() => {
//       setUploadStatus('Upload Complete');
//     }, 1500); // Simulate upload time
//   }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop});

  return (
    <div {...getRootProps()} className="border-dashed border-2 border-blue-500 rounded-md p-4 text-center text-blue-500 cursor-pointer align-middle">
      <input {...getInputProps()} />
      {
        isDragActive ?
          <p className="text-blue-500 align-middle">Drop the files here ...</p> :
          <p className="text-blue-500 align-middle">{uploadStatus}</p>
      }
    </div>
  );
}

export default FileUpload;
