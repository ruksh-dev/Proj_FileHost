import { CreateMultipartUploadCommand, PutObjectCommand, CompleteMultipartUploadCommand, UploadPartCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "@/utils/s3Client";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const BUCKET_NAME=process.env.NEXT_PUBLIC_ORACLE_BUCKET_NAME;
const createMultiPartUpload=async(fileType: string, fileName: string)=>{
    try{
    const key='id-'+Date.now().toString(36)+'-'+Math.random().toString(36).substr(2,9);
    const command=new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        Metadata: {
            'original-filename': fileName
        }
    })
    const response=await s3Client.send(command);
    if(!response || !response.UploadId) throw Error("invalid response")
    return {
        key,
        uploadId: response.UploadId
    }
    }catch(err) {
        throw err
    }
}

const generatePreSignedUrls=async(totalChunks:number, key:string, uploadId?: string)=>{
    try{
        let preSignedUrls=[];
        for(let i=0;i<totalChunks;i++) {
            const command=new UploadPartCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: i+1,
            })
            const url=await getSignedUrl(s3Client,command,{expiresIn: 3600})
            preSignedUrls.push({PartNumber: i+1, url});
        }
        return preSignedUrls

    }catch(err){
        throw err;
    }
}
const completeMultiPartUpload=async(key:string, uploadId:string, parts: any[])=>{
    try{
    const command=new CompleteMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts
        }
    })
    const response=await s3Client.send(command);
    console.log("multipartResp: ",response);
}catch(err){
    console.log(err);
}
}

const getDownloadLink=async(key: string, fileName: string, fileType: string)=>{
    try{
        const command=new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`, // Set the file name
            ResponseContentType: fileType, // Set the file type
        })
        const url=await getSignedUrl(s3Client,command,{expiresIn: 3600})
        return url;

    }catch(err){
        console.log(err);
    }
}

const handleUpload=async(totalChunks: number, fileType: string, fileName: string)=>{
    try{
        const {key, uploadId}=await createMultiPartUpload(fileType,fileName);
        const preSignedUrls=await generatePreSignedUrls(totalChunks, key, uploadId);
        return {key,preSignedUrls, uploadId};

    }catch(err){
        console.log(err);
    }
}
export {handleUpload, completeMultiPartUpload, getDownloadLink};
