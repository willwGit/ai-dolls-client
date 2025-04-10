import { Dialog, DialogContent } from '@/components/ui/dialog';
import { filterImage } from '@/utils/business';
import { Dispatch, FC, SetStateAction, useEffect, useRef } from 'react';

export const VideoDialog: FC<{
  videoUrl: string;
  poster: string;
  visible: boolean;
  setVisible: Dispatch<SetStateAction<boolean>>;
}> = ({ videoUrl, poster, visible, setVisible }) => {
  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent>
        <div className="w-[90vw]">
          <video
            className="video-dom h-full w-full"
            id="myVideo"
            loop
            autoPlay
            controls
            playsInline
            x5-video-player-type="h5-page"
            x5-video-orientation="portraint"
            x5-video-player-fullscreen=""
            x-webkit-airplay
            webkit-playsinline
            show-fullscreen-btn="false"
            object-fit="cover"
            src={filterImage(videoUrl)}
            poster={filterImage(poster)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
