import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface FlyingCartItem {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  image: string;
}

interface FlyingCartOverlayProps {
  items: FlyingCartItem[];
}

export const FlyingCartOverlay: React.FC<FlyingCartOverlayProps> = ({ items }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[999999] overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              left: item.startX,
              top: item.startY,
              x: '-50%',
              y: '-50%',
              scale: 0.9,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              left: [item.startX, (item.startX + item.endX) / 2, item.endX],
              top: [item.startY, Math.min(item.startY, item.endY) - 90, item.endY],
              scale: [0.9, 1.25, 0.25],
              opacity: [1, 1, 0.4],
              rotate: [0, -18, 12, 0],
            }}
            exit={{
              opacity: 0,
              scale: 0.1,
            }}
            transition={{
              duration: 0.85,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute pointer-events-none"
          >
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 shadow-[0_15px_35px_rgba(0,0,0,0.35)] border-2 border-white ring-2 ring-black/20 flex items-center justify-center overflow-hidden">
              <img
                src={item.image}
                alt="Added item"
                className="w-full h-full object-cover rounded-xl"
              />
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-white">
                +1
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
