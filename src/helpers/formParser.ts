import { NextRequest } from "next/server";
import formidable from 'formidable';

export const handleMultipartForm = async (req: NextRequest) => {
  return new Promise((resolve, reject) => {
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // Convert NextRequest to Node.js request format
    const nodeReq = req as any;
    
    form.parse(nodeReq, (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        resolve({ fields, files });
      }
    });
  });
};