import React from 'react';
import Album from '../components/Album';
import { CatImage } from '../types';

interface AlbumPageProps {
  allImages: CatImage[];
  unlockedImageIds: number[];
}

const AlbumPage: React.FC<AlbumPageProps> = ({ allImages, unlockedImageIds }) => {
  return (
    <div>
      <Album allImages={allImages} unlockedImageIds={unlockedImageIds} />
    </div>
  );
};

export default AlbumPage;
