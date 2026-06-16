import React, { useRef, useEffect, useCallback } from 'react';

const FRAG_SHADER = `
  precision mediump float;

  uniform vec3 iResolution;
  uniform sampler2D iChannel0;

  void mainImage(out vec4 fragColor, in vec2 fragCoord)
  {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = texture2D(iChannel0, uv);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const VERT_SHADER = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

interface LiquidGlassProps {
  /** The source image URL for the glass distortion background */
  backgroundImageUrl?: string;
  /** CSS class for the outer wrapper */
  className?: string;
  /** Inline styles for the outer wrapper */
  style?: React.CSSProperties;
  /** Content rendered on top of the glass effect */
  children?: React.ReactNode;
}

export function LiquidGlass({
  backgroundImageUrl,
  className = '',
  style,
  children,
}: LiquidGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const uniformsRef = useRef<Record<string, WebGLUniformLocation | null>>({});
  const mouseRef = useRef<[number, number]>([-1000, -1000]);
  const rafRef = useRef<number>(0);
  const textureRef = useRef<WebGLTexture | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const createShader = useCallback(
    (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    },
    []
  );

  // Capture the page content behind the nav bar as a texture
  const captureBackground = useCallback(() => {
    const canvas = canvasRef.current;
    const gl = glRef.current;
    if (!canvas || !gl) return;

    // Find the scrollable content area (the sibling div with overflow-auto)
    const container = containerRef.current;
    if (!container) return;
    
    const parentEl = container.closest('.flex-1.flex.flex-col.h-full');
    const scrollArea = parentEl?.querySelector('.flex-1.overflow-auto') as HTMLElement | null;
    
    if (!scrollArea) return;

    // Use html2canvas-like approach: draw a solid gradient matching the app background
    // For performance, we create a simple gradient texture
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas');
    }
    const capCanvas = captureCanvasRef.current;
    capCanvas.width = canvas.width;
    capCanvas.height = canvas.height;
    const ctx = capCanvas.getContext('2d');
    if (!ctx) return;

    // Create a gradient that matches the app's emerald theme
    const gradient = ctx.createLinearGradient(0, 0, capCanvas.width, capCanvas.height);
    gradient.addColorStop(0, '#ecfdf5');  // emerald-50
    gradient.addColorStop(0.5, '#ffffff'); // white
    gradient.addColorStop(1, '#f0fdfa');   // teal-50
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, capCanvas.width, capCanvas.height);

    // Update GL texture with the captured content
    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, capCanvas);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { 
      alpha: true, 
      premultipliedAlpha: false,
      preserveDrawingBuffer: true 
    });
    if (!gl) {
      console.warn('WebGL not available for LiquidGlass');
      return;
    }
    glRef.current = gl;

    // Create shaders and program
    const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);
    programRef.current = program;

    // Buffer setup
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    uniformsRef.current = {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      texture: gl.getUniformLocation(program, 'iChannel0'),
    };

    // Texture setup
    const texture = gl.createTexture();
    textureRef.current = texture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Load the background image if provided, otherwise use gradient
    if (backgroundImageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      };
      img.src = backgroundImageUrl;
    } else {
      // Create a default gradient texture
      const gradCanvas = document.createElement('canvas');
      gradCanvas.width = 512;
      gradCanvas.height = 128;
      const ctx = gradCanvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, gradCanvas.width, gradCanvas.height);
        gradient.addColorStop(0, '#ecfdf5');
        gradient.addColorStop(0.3, '#d1fae5');
        gradient.addColorStop(0.5, '#ffffff');
        gradient.addColorStop(0.7, '#ccfbf1');
        gradient.addColorStop(1, '#f0fdfa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, gradCanvas.width, gradCanvas.height);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, gradCanvas);
      }
    }

    // Set canvas size
    const setSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      // Keep mouse off-screen initially
      mouseRef.current = [-1000, -1000];
    };
    setSize();

    // Start time
    startTimeRef.current = performance.now();

    // Render loop
    const render = () => {
      if (!glRef.current) return;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform3f(uniformsRef.current.resolution!, canvas.width, canvas.height, 1.0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
      gl.uniform1i(uniformsRef.current.texture!, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      setSize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      glRef.current = null;
    };
  }, [backgroundImageUrl, createShader]);

  // Mouse/touch tracking relative to the container
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const x = (e.clientX - rect.left) * dpr;
    const y = (rect.height - (e.clientY - rect.top)) * dpr;
    mouseRef.current = [x, y];
  }, []);

  const handlePointerLeave = useCallback(() => {
    mouseRef.current = [-1000, -1000];
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* WebGL canvas for the glass effect */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          borderRadius: 'inherit',
        }}
      />
      {/* Content on top of the glass */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
