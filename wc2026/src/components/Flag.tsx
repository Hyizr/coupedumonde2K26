import React from 'react';
import { FLAG_DATA } from '../data';

interface Props {
  code: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export default function Flag({ code, width = 22, height = 16, style }: Props) {
  const src = (FLAG_DATA as Record<string, string>)[code] || '';
  if (!src) return null;
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={code}
      style={{
        borderRadius: 2, objectFit: 'cover', flexShrink: 0, verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
