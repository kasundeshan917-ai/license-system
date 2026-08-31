// ============================================================
//  WATER WAVE BACKGROUND + WHITE DOTS
//  Card Tilt Effect · Mouse Opacity
// ============================================================

(function() {
    'use strict';
    
    console.log('🌊 Loading Water Wave + Dots...');
    
    function init() {
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        let width, height;
        let time = 0;
        let particles = [];
        let mouse = { x: null, y: null };
        
        // ===== RESIZE =====
        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            createParticles();
            console.log('📐 Canvas:', width, 'x', height);
        }
        
        // ===== CREATE WHITE DOTS =====
        function createParticles() {
            const count = Math.min(Math.floor((width * height) / 5000), 200);
            particles = [];
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    radius: Math.random() * 2.5 + 0.8,
                    dx: (Math.random() - 0.5) * 1.5,
                    dy: (Math.random() - 0.5) * 1.5,
                    baseOpacity: Math.random() * 0.2 + 0.15,
                    pulseSpeed: Math.random() * 0.025 + 0.005,
                    pulseOffset: Math.random() * Math.PI * 2,
                    pattern: Math.floor(Math.random() * 3),
                    angle: Math.random() * Math.PI * 2,
                    orbitSpeed: Math.random() * 0.015 + 0.005,
                    orbitRadius: Math.random() * 150 + 50,
                    centerX: Math.random() * width,
                    centerY: Math.random() * height,
                });
            }
            console.log('✅ Created', particles.length, 'white dots');
        }
        
        // ===== DRAW WATER WAVE BACKGROUND =====
        function drawWaterBackground() {
            time += 0.008;
            
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#050a14');
            gradient.addColorStop(0.2, '#08101e');
            gradient.addColorStop(0.4, '#0a1525');
            gradient.addColorStop(0.6, '#0a1525');
            gradient.addColorStop(0.8, '#08101e');
            gradient.addColorStop(1, '#050a14');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            
            const waveCount = 5;
            for (let w = 0; w < waveCount; w++) {
                const waveHeight = 30 + w * 12;
                const waveWidth = 800 + w * 150;
                const speed = 0.008 + w * 0.003;
                const offset = w * 1.5;
                const alpha = 0.04 + w * 0.015;
                
                ctx.beginPath();
                ctx.moveTo(0, height / 2 + waveHeight * 0.3);
                
                for (let x = 0; x <= width; x += 2) {
                    const y = height / 2 
                        + Math.sin(x / waveWidth + time * speed + offset) * waveHeight * 0.5
                        + Math.sin(x / (waveWidth * 0.5) + time * speed * 1.3 + offset * 1.2) * waveHeight * 0.3
                        + Math.sin(x / (waveWidth * 0.3) + time * speed * 0.7 + offset * 0.8) * waveHeight * 0.2;
                    
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                const blue1 = 15 + w * 10;
                const blue2 = 40 + w * 15;
                grad.addColorStop(0, `rgba(5, 15, ${blue1}, ${alpha * 0.4})`);
                grad.addColorStop(0.5, `rgba(8, 25, ${blue2}, ${alpha * 0.7})`);
                grad.addColorStop(1, `rgba(5, 15, ${blue1}, ${alpha * 0.3})`);
                
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }
            
            for (let i = 0; i < 12; i++) {
                const x = (Math.sin(time * 0.5 + i * 2.3) * 0.5 + 0.5) * width;
                const y = (Math.sin(time * 0.3 + i * 1.7 + 1.2) * 0.3 + 0.5) * height;
                const r = 20 + Math.sin(time + i) * 10;
                const shimmer = ctx.createRadialGradient(x, y, 0, x, y, r);
                shimmer.addColorStop(0, `rgba(60, 120, 200, ${0.02 + Math.sin(time + i) * 0.008 + 0.01})`);
                shimmer.addColorStop(1, 'rgba(60, 120, 200, 0)');
                ctx.fillStyle = shimmer;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // ===== DRAW DOTS =====
        function drawDots() {
            const currentTime = Date.now() * 0.001;
            
            for (const p of particles) {
                const pulse = Math.sin(currentTime * p.pulseSpeed + p.pulseOffset) * 0.2 + 0.8;
                
                let opacityMultiplier = 1;
                
                if (mouse.x && mouse.y) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    const mouseRadius = 150;
                    if (dist < mouseRadius) {
                        const factor = 1 - (dist / mouseRadius);
                        opacityMultiplier = 1 + (factor * 2.5);
                    }
                }
                
                const finalOpacity = p.baseOpacity * pulse * opacityMultiplier;
                
                const gradient = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.radius * 4
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity * 0.5})`);
                gradient.addColorStop(0.5, `rgba(200, 230, 255, ${finalOpacity * 0.15})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(finalOpacity * 0.95, 1)})`;
                ctx.fill();
                
                if (p.radius > 1.2 && finalOpacity > 0.2) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(finalOpacity * 0.7, 1)})`;
                    ctx.fill();
                }
            }
            
            if (mouse.x && mouse.y) {
                const mouseGradient = ctx.createRadialGradient(
                    mouse.x, mouse.y, 0,
                    mouse.x, mouse.y, 120
                );
                mouseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
                mouseGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.beginPath();
                ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
                ctx.fillStyle = mouseGradient;
                ctx.fill();
            }
        }
        
        // ===== UPDATE DOTS =====
        function updateDots() {
            for (const p of particles) {
                switch(p.pattern) {
                    case 0:
                        p.x += p.dx;
                        p.y += p.dy;
                        break;
                    case 1:
                        p.angle += p.orbitSpeed;
                        p.x = p.centerX + Math.cos(p.angle) * p.orbitRadius;
                        p.y = p.centerY + Math.sin(p.angle) * p.orbitRadius * 0.6;
                        break;
                    case 2:
                        p.x += p.dx;
                        p.y += p.dy + Math.sin(p.x * 0.02 + time) * 0.3;
                        break;
                }
                
                if (p.x < 0 || p.x > width) {
                    p.dx *= -1;
                    p.dy += (Math.random() - 0.5) * 0.1;
                }
                if (p.y < 0 || p.y > height) {
                    p.dy *= -1;
                    p.dx += (Math.random() - 0.5) * 0.1;
                }
                
                p.x = Math.max(0, Math.min(width, p.x));
                p.y = Math.max(0, Math.min(height, p.y));
                
                p.dx += (Math.random() - 0.5) * 0.03;
                p.dy += (Math.random() - 0.5) * 0.03;
                
                const speed = Math.sqrt(p.dx * p.dx + p.dy * p.dy);
                if (speed > 1.2) {
                    p.dx = (p.dx / speed) * 1.2;
                    p.dy = (p.dy / speed) * 1.2;
                }
                if (speed < 0.2 && p.pattern !== 1) {
                    p.dx += (Math.random() - 0.5) * 0.1;
                    p.dy += (Math.random() - 0.5) * 0.1;
                }
            }
        }
        
        // ===== ANIMATE =====
        function animate() {
            drawWaterBackground();
            updateDots();
            drawDots();
            requestAnimationFrame(animate);
        }
        
        // ===== MOUSE =====
        window.addEventListener('mousemove', function(e) {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });
        
        window.addEventListener('mouseleave', function() {
            mouse.x = null;
            mouse.y = null;
        });
        
        window.addEventListener('touchmove', function(e) {
            const touch = e.touches[0];
            mouse.x = touch.clientX;
            mouse.y = touch.clientY;
        }, { passive: true });
        
        window.addEventListener('touchend', function() {
            mouse.x = null;
            mouse.y = null;
        });
        
        // ===== START =====
        window.addEventListener('resize', function() {
            resize();
            for (const p of particles) {
                p.centerX = Math.random() * width;
                p.centerY = Math.random() * height;
            }
        });
        
        resize();
        animate();
        
        console.log('🌊 Water Wave + Dots started!');
    }
    
    // ============================================================
    //  CARD TILT / PARALLAX EFFECT
    //  Follows mouse movement with smooth rotation
    // ============================================================
    
    document.addEventListener('DOMContentLoaded', function() {
        const heroCode = document.querySelector('.hero-code');
        if (!heroCode) {
            console.log('⚠️ .hero-code not found, skipping tilt effect');
            return;
        }
        
        console.log('✅ Card tilt effect initialized!');
        let isTouching = false;
        let currentRotateX = 0;
        let currentRotateY = 0;
        let targetRotateX = 0;
        let targetRotateY = 0;
        let animationFrame = null;
        
        // ===== SMOOTH UPDATE =====
        function smoothUpdate() {
            currentRotateX += (targetRotateX - currentRotateX) * 0.08;
            currentRotateY += (targetRotateY - currentRotateY) * 0.08;
            
            heroCode.style.transform = `perspective(1000px) rotateX(${currentRotateX}deg) rotateY(${currentRotateY}deg) scale(1.02)`;
            heroCode.style.transition = 'none';
            
            if (Math.abs(currentRotateX - targetRotateX) > 0.01 || Math.abs(currentRotateY - targetRotateY) > 0.01) {
                animationFrame = requestAnimationFrame(smoothUpdate);
            } else {
                heroCode.style.transform = `perspective(1000px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale(1.02)`;
                animationFrame = null;
            }
        }
        
        // ===== TILT ON MOUSE MOVE =====
        document.addEventListener('mousemove', function(e) {
            if (isTouching) return;
            
            const rect = heroCode.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            targetRotateY = ((e.clientX - centerX) / (rect.width / 2)) * 8;
            targetRotateX = -((e.clientY - centerY) / (rect.height / 2)) * 8;
            
            if (!animationFrame) {
                smoothUpdate();
            }
        });
        
        // ===== RESET ON MOUSE LEAVE =====
        document.addEventListener('mouseleave', function() {
            if (isTouching) return;
            targetRotateX = 0;
            targetRotateY = 0;
            if (!animationFrame) {
                smoothUpdate();
            }
            heroCode.style.transition = 'transform 0.6s ease-out';
        });
        
        // ===== RESET ON MOUSE ENTER =====
        document.addEventListener('mouseenter', function() {
            heroCode.style.transition = 'none';
        });
        
        // ===== TOUCH SUPPORT =====
        document.addEventListener('touchmove', function(e) {
            isTouching = true;
            const touch = e.touches[0];
            if (!touch) return;
            
            const rect = heroCode.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            targetRotateY = ((touch.clientX - centerX) / (rect.width / 2)) * 6;
            targetRotateX = -((touch.clientY - centerY) / (rect.height / 2)) * 6;
            
            if (!animationFrame) {
                smoothUpdate();
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function() {
            isTouching = false;
            targetRotateX = 0;
            targetRotateY = 0;
            if (!animationFrame) {
                smoothUpdate();
            }
            heroCode.style.transition = 'transform 0.6s ease-out';
        }, { passive: true });
    });
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();