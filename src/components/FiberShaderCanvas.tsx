"use client";

import React, { useRef, useEffect } from "react";

/**
 * FiberShaderCanvas: Shader interactivo WebGL en tiempo real para Nora ISP / Carale Internet
 * Renderiza 32 filamentos ópticos monomodo con pulsos de fotones láser (cian #06b6d4 y azul neón #3b82f6)
 * e interacción suave con la posición del cursor del ratón.
 */
export default function FiberShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Inicializar contexto WebGL con soporte de fallback
    const gl =
      canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "high-performance" }) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);

    if (!gl) {
      console.warn("[FIBER_SHADER]: WebGL no disponible en el cliente.");
      return;
    }

    // Vertex Shader: Cuadrilátero en pantalla completa (Clip Space)
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment Shader: 32 filamentos ópticos con ondas senoidales, pulsos de tráfico y viñeta
    const fsSource = `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      varying vec2 v_uv;

      void main() {
        vec2 st = (gl_FragCoord.xy * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);
        vec2 mouse = (u_mouse * 2.0 - u_resolution) / min(u_resolution.x, u_resolution.y);

        // Influencia suave del ratón
        float mouseDist = length(st - mouse);
        float mouseWave = sin(mouseDist * 6.0 - u_time * 2.0) * 0.06 * exp(-mouseDist * 1.5);
        st.y += mouseWave;

        vec3 finalColor = vec3(0.015, 0.025, 0.045); // Tono de fondo oscuro Slate 950

        // Paleta de telecomunicaciones: Cian Eléctrico y Azul Neón Profundo
        vec3 cyanLaser = vec3(0.024, 0.714, 0.831); // #06b6d4
        vec3 blueNeon  = vec3(0.231, 0.510, 0.965); // #3b82f6
        vec3 lightSky  = vec3(0.404, 0.820, 0.980); // #67e8f9

        // 32 filamentos monomodo en trayectorias de transmisión
        for (int i = 0; i < 32; i++) {
          float fi = float(i);
          float offset = fi * 0.196; // 6.28 / 32
          
          // Curva de la fibra óptica
          float freq = 1.2 + sin(fi * 0.4) * 0.5;
          float speed = u_time * (0.45 + mod(fi, 4.0) * 0.15);
          float yOffset = (fi - 16.0) * 0.06;
          
          float wave = sin(st.x * freq + speed + offset) * 0.28 + cos(st.x * 0.65 - speed * 0.8) * 0.12;
          float dist = abs(st.y - (wave + yOffset));

          // Pulso de fotón / paquete de datos recorriendo la fibra
          float packet = sin(st.x * 2.5 - speed * 3.5 + fi * 0.7);
          float packetIntensity = smoothstep(0.7, 1.0, packet) * 2.2;

          // Espesor de haz y resplandor óptico (Glow)
          float glow = 0.0035 / (dist + 0.0035);
          glow += (0.0018 / (dist + 0.0012)) * packetIntensity;

          vec3 fiberCol = mix(blueNeon, cyanLaser, sin(fi * 0.2 + u_time * 0.3) * 0.5 + 0.5);
          fiberCol = mix(fiberCol, lightSky, packetIntensity * 0.4);

          finalColor += fiberCol * glow * (0.05 + packetIntensity * 0.07);
        }

        // Viñeta perimetral de legibilidad para mantener el texto cristalino en el centro
        float vignette = 1.0 - smoothstep(0.4, 1.45, length(st * vec2(0.85, 1.15)));
        finalColor *= vignette;

        gl_FragColor = vec4(finalColor, 0.88);
      }
    `;

    // Función auxiliar para compilar shaders
    function compileShader(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[FIBER_SHADER COMPILE ERROR]:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[FIBER_SHADER LINK ERROR]:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffer de posiciones para pantalla completa (-1 a 1)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
       1.0,  1.0,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolutionLoc = gl.getUniformLocation(program, "u_resolution");
    const uTimeLoc = gl.getUniformLocation(program, "u_time");
    const uMouseLoc = gl.getUniformLocation(program, "u_mouse");

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    // Manejo de tamaño responsive del canvas
    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
      if (uResolutionLoc && gl) gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Interacción suave con mousemove
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      targetMouseX = (e.clientX - rect.left) * dpr;
      targetMouseY = (rect.height - (e.clientY - rect.top)) * dpr;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Loop de renderizado con requestAnimationFrame
    let animationFrameId: number;
    let startTime = performance.now();

    const render = (currentTime: number) => {
      if (!gl) return;
      const elapsedTime = (currentTime - startTime) * 0.001;

      // Interpolar mouse suavemente (damping)
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      if (uTimeLoc) gl.uniform1f(uTimeLoc, elapsedTime);
      if (uMouseLoc) gl.uniform2f(uMouseLoc, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Limpieza rigurosa al desmontar
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);

      if (gl) {
        if (positionBuffer) gl.deleteBuffer(positionBuffer);
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
        if (program) gl.deleteProgram(program);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" aria-hidden="true" />;
}

