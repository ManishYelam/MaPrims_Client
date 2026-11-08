import React from "react";

const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="relative w-16 h-16 [perspective:800px]">
        <div
          className="absolute top-1/2 left-1/2 w-10 h-10 [transform-style:preserve-3d]"
          style={{
            marginLeft: "-20px",
            marginTop: "-20px",
            animation: "cubeRotate 2s infinite ease-in-out",
          }}
        >
          <div className="absolute w-10 h-10 rounded-sm bg-primary-600 shadow-[0_0_18px_var(--primary-500)] [transform:translateZ(20px)]" />
          <div className="absolute w-10 h-10 rounded-sm bg-primary-800 [transform:rotateY(180deg)_translateZ(20px)]" />
          <div className="absolute w-10 h-10 rounded-sm bg-primary-500 [transform:rotateY(90deg)_translateZ(20px)]" />
          <div className="absolute w-10 h-10 rounded-sm bg-primary-700 [transform:rotateY(-90deg)_translateZ(20px)]" />
          <div className="absolute w-10 h-10 rounded-sm bg-primary-400 [transform:rotateX(90deg)_translateZ(20px)]" />
          <div className="absolute w-10 h-10 rounded-sm bg-primary-900 [transform:rotateX(-90deg)_translateZ(20px)]" />
        </div>
      </div>

      <style>{`
        @keyframes cubeRotate {
          0% {
            transform: rotateX(-25deg) rotateY(25deg);
          }
          25% {
            transform: rotateX(-25deg) rotateY(115deg);
          }
          50% {
            transform: rotateX(65deg) rotateY(205deg);
          }
          75% {
            transform: rotateX(155deg) rotateY(295deg);
          }
          100% {
            transform: rotateX(335deg) rotateY(385deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Loading;
