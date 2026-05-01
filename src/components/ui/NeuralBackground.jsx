import { useEffect, useRef } from 'react'

export default function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []
    let width = 0
    let height = 0
    let mouse = { x: -1000, y: -1000 }

    const onMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    // Canvas styling properties similar to classic neural/plexus fx
    const particleCount = 180 // Density of nodes
    const connectDistance = Math.min(window.innerWidth * 0.15, 200) // Max distance to draw connecting lines
    const nodeSpeed = 1.0 // Speed of drift
    const nodeColor = 'rgba(14, 165, 233, 1)' // Blue sky/cyan
    const lineColor = 'rgba(14, 165, 233, ' // Line color prefix (rgb)

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      if (particles.length === 0) initParticles()
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.vx = (Math.random() - 0.5) * nodeSpeed
        this.vy = (Math.random() - 0.5) * nodeSpeed
        this.radius = Math.random() * 2 + 1
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Mouse interaction: push away slowly
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist < 150) {
          this.x -= dx * 0.015
          this.y -= dy * 0.015
        }

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx = -this.vx
        if (this.y < 0 || this.y > height) this.vy = -this.vy
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = nodeColor
        // Add a subtle glow
        ctx.shadowBlur = 10
        ctx.shadowColor = nodeColor
        ctx.fill()
        ctx.shadowBlur = 0 // Reset
      }
    }

    const initParticles = () => {
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectDistance) {
            const opacity = 1 - Math.pow(distance / connectDistance, 1.5)
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `${lineColor}${opacity * 0.6})` // Brighter opacity for lines
            ctx.lineWidth = opacity * 1.5
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Update and draw particles
      particles.forEach(p => {
        p.update()
        p.draw()
      })

      // Draw connecting lines
      drawLines()

      animationFrameId = requestAnimationFrame(animate)
    }

    // Initialize
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    resize()
    animate()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}
