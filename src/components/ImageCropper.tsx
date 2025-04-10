import React, { useState, useRef, FunctionComponent, FC } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { uploadFile } from '@/utils/business'; // 请确保路径和方法适应您的项目结构和类型系统

interface ImageCropperProps {
  setHead: (url: string) => void;
}

const ImageCropper: FC<ImageCropperProps> = ({ setHead }) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const InputRef = useRef<HTMLInputElement | null>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const cropperOptions: {
    dragMode: Cropper.DragMode;
    viewMode: Cropper.ViewMode;
    aspectRatio: number;
    movable: boolean;
    toggleDragModeOnDblclick: boolean;
    cropBoxResizable: boolean;
  } = {
    dragMode: 'move',
    viewMode: 2,
    aspectRatio: 1,
    movable: true,
    toggleDragModeOnDblclick: false,
    cropBoxResizable: false,
  };

  const onSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const fileReader = new FileReader();
      fileReader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          setImageSrc(e.target.result as string);
        }
      };
      fileReader.readAsDataURL(event.target.files[0]);
    }
  };

  const cropImage = () => {
    InputRef.current!.value = '';
    if (cropperRef.current?.cropper.getCroppedCanvas()) {
      cropperRef.current.cropper
        .getCroppedCanvas()
        .toBlob((blob: Blob | null) => {
          setLoading(true);
          if (blob) {
            uploadFile(blob, 'cropped-image.png')
              .then((url: string) => {
                setImageSrc('');
                setHead(url);
              })
              .finally(() => {
                setLoading(false);
              });
          }
        }, 'image/png');
    }
  };

  return (
    <div
      className={`absolute left-0 top-0 size-full ${
        loading ? 'is-loading' : ''
      }`}
    >
      <input
        className="size-full opacity-0"
        type="file"
        accept="image/*"
        ref={InputRef}
        onChange={onSelectFile}
      />
      {imageSrc && (
        <>
          <div className="fixed size-full left-0 top-0 z-10 bg-black bg-opacity-50" />
          <div className="fixed z-20 flex flex-wrap justify-center items-center w-[80vw]  left-2/4 top-2/4 -translate-y-2/4 -translate-x-2/4">
            <Cropper
              src={imageSrc}
              ref={cropperRef}
              {...cropperOptions}
              className="h-[80vw] w-full max-h-96 max-w-96 mb-5"
            />
            <div className="w-full text-lg text-white flex items-center justify-around">
              <div
                className="flex justify-center items-center w-[40%] h-8 text-[#745efe] rounded-full bg-white"
                onClick={() => {
                  InputRef.current!.value = '';
                  setImageSrc('');
                }}
              >
                Cancel
              </div>
              <button
                className="btn-loading flex justify-center items-center w-[40%] h-8 bg-[#745efe] rounded-full text-white"
                onClick={cropImage}
                disabled={loading}
              >
                <span className="loading loading-spinner !size-4 mr-1"></span>
                Accept
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCropper;
