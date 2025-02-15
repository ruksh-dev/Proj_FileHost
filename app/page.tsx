'use client'
import {handleUpload, completeMultiPartUpload, getDownloadLink} from '@/components/actions/handleMultiPartUpload';
import {FormEvent, useRef, useState} from 'react'
import axios from 'axios'
import { headers } from 'next/headers';

const getChunks=(file:any,fileSize:number)=>{
  const chunkSize=5*1024*104;
    const totalChunks=Math.ceil(fileSize/chunkSize);
    let chunks=[];
    let offset=0;
    while(offset<fileSize) {
        const chunk=file.slice(offset,offset+chunkSize);
        chunks.push(chunk);
        offset+=chunkSize;
    }
    return {chunks, totalChunks};
}

const uploadChunks=async(chunks: any[], totalChunks:number, fileType: string, fileName: string)=>{
  try{
  const response=await handleUpload(totalChunks, fileType,fileName);
  if(!response || !response.preSignedUrls || !response.key || !response.uploadId) throw Error("did not recieved data")
  const parts:any[]=[]
  for(let i=0;i<totalChunks;i++) {
    const url=response.preSignedUrls[i].url
    if(!url) throw Error("url not defined")
    const uploadPartResponse=await axios.put(url,chunks[i])
    if(!uploadPartResponse || !uploadPartResponse.headers) throw Error("failed to upload part!") 
    parts.push({PartNumber: i+1, ETag: uploadPartResponse.headers['etag']})
  }
  const completeMultiPartUploadResponse=await completeMultiPartUpload(response.key, response.uploadId, parts)
  return response?.key;
  }catch(err){
    console.log(err);
  }
}

const downloadFile=async()=>{
  try{

  }catch(err){
    console.log(err);
  }
}
const FileDownloadLink = ({ fileUrl, fileName }:{fileUrl:string, fileName:string}) => {
  return (
      <div className='h-full flex flex-col items-center bg-white p-2 rounded-md'>
          <label className='text-black' htmlFor='fileDownload'>Download File</label>
          <a
              id='fileDownload'
              href={fileUrl}
              download={fileName}
              className='text-blue-500'
          >
              {fileName}
          </a>
      </div>
  );
};
interface fileMetaDataProps {
  fileName: string;
  fileType: string;
  fileUrl: string;
}
export default function Home() {
  const [fileMetaData,setFileMetaData]=useState<fileMetaDataProps | null>(null)
  const formRef=useRef<HTMLFormElement | null>(null)
  const handleSubmit=async(e:any)=>{
    try{
    e.preventDefault();
    const file=e.target.fileUpload.files[0];
    const fileSize=file.size;
    const fileType=file.type;
    const fileName=file.name;
    const {chunks, totalChunks}=getChunks(file,fileSize);
    const objectKey=await uploadChunks(chunks, totalChunks,fileType,fileName) as string
    const url=await getDownloadLink(objectKey!,fileName,fileType) as string
    setFileMetaData({fileName, fileType, fileUrl: url})
    if(formRef && formRef.current) formRef.current.reset();
    }catch(err){
      console.log(err);
    }
  }
  
  return (
    <div className='w-max h-48 border-white flex flex-col items-center justify-around p-3'>
    <form className='h-full flex flex-col items-center' 
          method="post" 
          encType="multipart/form-data" 
          onSubmit={handleSubmit}
          ref={formRef} >
       <label>Choose file to upload</label>
       <input
        type="file"
        name="fileUpload"
        accept='*/*'
         />
        <button className='bg-gray-700 p-2 rounded-md' type="submit">Submit</button>
    </form>
    {fileMetaData && <FileDownloadLink fileUrl={fileMetaData?.fileUrl} fileName={fileMetaData?.fileName} />}
    </div>
  );
}
