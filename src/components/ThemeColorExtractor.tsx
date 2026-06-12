'use client';

import { useEffect } from 'react';

interface ThemeColorExtractorProps {
  imageUrl: string | null | undefined;
}

export default function ThemeColorExtractor({ imageUrl }: ThemeColorExtractorProps) {
  useEffect(() => {
    if (!imageUrl) {
      // If no image, reset to default brand orange
      document.documentElement.style.setProperty('--primary', '#FF4500');
      try {
        localStorage.removeItem('theme-primary-color');
      } catch (e) {}
      return;
    }

    const img = new Image();
    // Allow cross-origin requests since the image is served from local Debian server
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Downscale image to 40x40 to simplify calculation and remove noise
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        
        // Helper to convert RGB to HSL
        const rgbToHsl = (r: number, g: number, b: number) => {
          r /= 255;
          g /= 255;
          b /= 255;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          let h = 0;
          let s = 0;
          const l = (max + min) / 2;

          if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
              case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
              case g:
                h = (b - r) / d + 2;
                break;
              case b:
                h = (r - g) / d + 4;
                break;
            }
            h /= 6;
          }
          return { h: h * 360, s: s * 100, l: l * 100 };
        };

        // Filter and collect vibrant/colorful pixels
        interface ColorfulPixel {
          r: number;
          g: number;
          b: number;
          h: number;
          s: number;
          l: number;
          score: number;
        }

        const colorfulPixels: ColorfulPixel[] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Ignore fully transparent pixels
          if (a < 128) continue;

          const { h, s, l } = rgbToHsl(r, g, b);

          // We want accent colors:
          // - Discard very dark pixels (l < 15) and very bright/white pixels (l > 85)
          // - Discard neutral grey/un-saturated pixels (s < 25)
          if (l > 15 && l < 85 && s > 25) {
            // Prioritize saturated mid-tones (l near 50%)
            const lightnessFactor = 1 - Math.abs(l - 55) / 50; 
            const saturationFactor = s / 100;
            const score = saturationFactor * lightnessFactor;

            colorfulPixels.push({ r, g, b, h, s, l, score });
          }
        }

        if (colorfulPixels.length > 0) {
          // Sort pixels by score descending to find the most vibrant ones
          colorfulPixels.sort((a, b) => b.score - a.score);

          // Take the top 15% most vibrant pixels to compute the dominant accent
          const topPercent = 0.15;
          const count = Math.max(1, Math.floor(colorfulPixels.length * topPercent));
          const topPixels = colorfulPixels.slice(0, count);

          let sumR = 0;
          let sumG = 0;
          let sumB = 0;

          for (const pixel of topPixels) {
            sumR += pixel.r;
            sumG += pixel.g;
            sumB += pixel.b;
          }

          const avgR = Math.round(sumR / count);
          const avgG = Math.round(sumG / count);
          const avgB = Math.round(sumB / count);

          // Convert final RGB back to Hex for the custom property
          const rgbToHex = (rVal: number, gVal: number, bVal: number) => {
            const toHex = (c: number) => {
              const hex = c.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            };
            return '#' + toHex(rVal) + toHex(gVal) + toHex(bVal);
          };

          const dominantColorHex = rgbToHex(avgR, avgG, avgB);
          
          console.log('[ThemeColorExtractor] Extracted dominant color:', dominantColorHex);
          document.documentElement.style.setProperty('--primary', dominantColorHex);
          try {
            localStorage.setItem('theme-primary-color', dominantColorHex);
          } catch (e) {}
        } else {
          // Fallback to default brand orange if image has no vibrant colors
          document.documentElement.style.setProperty('--primary', '#FF4500');
          try {
            localStorage.removeItem('theme-primary-color');
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to extract color from banner image:', err);
        document.documentElement.style.setProperty('--primary', '#FF4500');
        try {
          localStorage.removeItem('theme-primary-color');
        } catch (e) {}
      }
    };

    img.onerror = (err) => {
      console.error('Failed to load image for color extraction:', err);
      document.documentElement.style.setProperty('--primary', '#FF4500');
    };
  }, [imageUrl]);

  return null;
}
