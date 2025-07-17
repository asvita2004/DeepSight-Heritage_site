import { useEffect, useRef } from 'react';

const CanvasCursorComponent = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
    ctx.running = true;
    ctx.frame = 1;

    // Oscillator class
    function Oscillator(options = {}) {
      this.phase = options.phase || 0;
      this.offset = options.offset || 0;
      this.frequency = options.frequency || 0.001;
      this.amplitude = options.amplitude || 1;
    }

    Oscillator.prototype.update = function() {
      this.phase += this.frequency;
      return this.offset + Math.sin(this.phase) * this.amplitude;
    };

    // Node class
    function Node() {
      this.x = 0;
      this.y = 0;
      this.vy = 0;
      this.vx = 0;
    }

    // Line class
    function Line(options = {}) {
      this.spring = options.spring + 0.1 * Math.random() - 0.02;
      this.friction = config.friction + 0.01 * Math.random() - 0.002;
      this.nodes = [];
      
      for (let i = 0; i < config.size; i++) {
        const node = new Node();
        node.x = pos.x;
        node.y = pos.y;
        this.nodes.push(node);
      }
    }

    Line.prototype.update = function() {
      let spring = this.spring;
      let node = this.nodes[0];
      
      node.vx += (pos.x - node.x) * spring;
      node.vy += (pos.y - node.y) * spring;
      
      for (let i = 0; i < this.nodes.length; i++) {
        node = this.nodes[i];
        
        if (i > 0) {
          const prevNode = this.nodes[i - 1];
          node.vx += (prevNode.x - node.x) * spring;
          node.vy += (prevNode.y - node.y) * spring;
          node.vx += prevNode.vx * config.dampening;
          node.vy += prevNode.vy * config.dampening;
        }
        
        node.vx *= this.friction;
        node.vy *= this.friction;
        node.x += node.vx;
        node.y += node.vy;
        
        spring *= config.tension;
      }
    };

    Line.prototype.draw = function() {
      let x = this.nodes[0].x;
      let y = this.nodes[0].y;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      
      for (let i = 1; i < this.nodes.length - 2; i++) {
        const currentNode = this.nodes[i];
        const nextNode = this.nodes[i + 1];
        x = 0.5 * (currentNode.x + nextNode.x);
        y = 0.5 * (currentNode.y + nextNode.y);
        ctx.quadraticCurveTo(currentNode.x, currentNode.y, x, y);
      }
      
      const secondLastNode = this.nodes[this.nodes.length - 2];
      const lastNode = this.nodes[this.nodes.length - 1];
      ctx.quadraticCurveTo(secondLastNode.x, secondLastNode.y, lastNode.x, lastNode.y);
      ctx.stroke();
      ctx.closePath();
    };

    // Configuration
    const config = {
      friction: 0.5,
      trails: 20,
      size: 50,
      dampening: 0.25,
      tension: 0.98,
    };

    // Global variables
    let pos = { x: 0, y: 0 };
    let lines = [];
    let colorOscillator;
    let isInitialized = false;

    // Initialize color oscillator
    colorOscillator = new Oscillator({
      phase: Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset: 285,
    });

    // Initialize lines
    function initLines() {
      lines = [];
      for (let i = 0; i < config.trails; i++) {
        lines.push(new Line({ spring: 0.4 + (i / config.trails) * 0.025 }));
      }
    }

    // Handle mouse/touch movement
    function handleMove(e) {
      if (e.touches) {
        pos.x = e.touches[0].clientX;
        pos.y = e.touches[0].clientY;
      } else {
        pos.x = e.clientX;
        pos.y = e.clientY;
      }
      
      if (!isInitialized) {
        initLines();
        isInitialized = true;
        render();
      }
      
      e.preventDefault();
    }

    function handleTouchStart(e) {
      if (e.touches.length === 1) {
        pos.x = e.touches[0].clientX;
        pos.y = e.touches[0].clientY;
      }
    }

    // Render function
    function render() {
      if (!ctx.running) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `hsla(${Math.round(colorOscillator.update())}, 50%, 50%, 0.2)`;
      ctx.lineWidth = 1;

      for (let i = 0; i < config.trails; i++) {
        const line = lines[i];
        if (line) {
          line.update();
          line.draw();
        }
      }

      ctx.frame++;
      animationRef.current = requestAnimationFrame(render);
    }

    // Resize canvas
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Event listeners
    const handleMouseMove = (e) => handleMove(e);
    const handleTouchMove = (e) => handleMove(e);
    const handleTouchStartEvent = (e) => handleTouchStart(e);

    // Initialize
    resizeCanvas();
    
    // Set initial position to center of canvas
    pos.x = canvas.width / 2;
    pos.y = canvas.height / 2;

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchstart', handleTouchStartEvent);
    window.addEventListener('resize', resizeCanvas);

    // Focus/blur handlers
    const handleFocus = () => {
      if (!ctx.running) {
        ctx.running = true;
        render();
      }
    };

    const handleBlur = () => {
      ctx.running = true; // Keep running even when blurred
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Start with initial animation
    initLines();
    render();

    // Cleanup function
    return () => {
      ctx.running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchStartEvent);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div style={{ 
      // width: '100vw', 
      // height: '100vh', 
      // margin: 0, 
      // padding: 0, 
      // // overflow: 'hidden',
      // // background: '#0a0a0a',
      // position: 'relative'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: 'none'
        }}
      />
      {/* <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: '#fff',
        fontSize: '14px',
        fontFamily: 'monospace',
        opacity: 0.7,
        pointerEvents: 'none'
      }}>
        Move your mouse or touch the screen to see the effect
      </div> */}
    </div>
  );
};

export default CanvasCursorComponent;