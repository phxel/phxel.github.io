class TerminalPortfolio {
    constructor() {
        this.input = document.querySelector('.input');
        this.history = document.querySelector('.history');
        this.blob = document.querySelector('.blob');
        this.content = document.querySelector('.terminal-content');
        
        this.mousePos = { x: 0, y: 0 };
        this.targetPos = { x: 0, y: 0 };
        
        this.initializeHistory();
        this.setupEventListeners();
        this.startBlobAnimation();
    }

    initializeHistory() {
        this.addToHistory('Welcome to my terminal portfolio. Type "help" to see available commands.', 'output');
    }

    setupEventListeners() {
        // Handle input submission
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = this.input.value.trim();
                if (command) {
                    this.handleCommand(command);
                    this.input.value = '';
                }
            }
        });

        // Handle mouse movement
        window.addEventListener('mousemove', (e) => {
            this.targetPos = {
                x: e.clientX,
                y: e.clientY
            };
        });

        // Keep input focused
        window.addEventListener('click', () => {
            this.input.focus();
        });
    }

    startBlobAnimation() {
        const animateBlob = () => {
            this.mousePos = {
                x: this.mousePos.x + (this.targetPos.x - this.mousePos.x) * 0.1,
                y: this.mousePos.y + (this.targetPos.y - this.mousePos.y) * 0.1
            };

            this.blob.style.left = `${this.mousePos.x}px`;
            this.blob.style.top = `${this.mousePos.y}px`;

            requestAnimationFrame(animateBlob);
        };

        requestAnimationFrame(animateBlob);
    }

    addToHistory(content, type) {
        const item = document.createElement('div');
        item.className = `history-item ${type}`;
        
        if (type === 'command') {
            item.innerHTML = `<span class="prompt">→</span> ${content}`;
        } else {
            item.textContent = content;
        }
        
        this.history.appendChild(item);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.content.scrollTop = this.content.scrollHeight;
    }

    handleCommand(command) {
        this.addToHistory(command, 'command');

        switch (command.toLowerCase()) {
            case 'help':
                this.addToHistory(`Available commands:
• help - Show this help message
• about - Learn about me
• projects - View my projects
• contact - Get my contact information
• skills - View my technical skills
• clear - Clear the terminal`, 'output');
                break;
            
            case 'about':
                this.addToHistory(`About Me:
I'm a passionate software developer with a love for creating intuitive and engaging web experiences. I specialize in full-stack development and enjoy building interactive applications that solve real-world problems.

Currently focused on:
• Web Development
• UI/UX Design
• System Architecture
• Open Source Contribution`, 'output');
                break;
            
            case 'projects':
                this.addToHistory(`My Projects:

1. Terminal Portfolio
An interactive terminal-style portfolio showcasing my work
Technologies: HTML, CSS, JavaScript

2. Project Management Dashboard
A comprehensive project management solution
Technologies: React, Node.js, MongoDB

3. E-commerce Platform
A full-featured online shopping platform
Technologies: Next.js, PostgreSQL, Stripe

4. Weather App
Real-time weather forecasting application
Technologies: React, OpenWeather API`, 'output');
                break;
            
            case 'contact':
                this.addToHistory(`Let's Connect!

• Email: example@example.com
• GitHub: github.com/example
• LinkedIn: linkedin.com/in/example
• Twitter: @example

Feel free to reach out for collaboration or just to say hi!`, 'output');
                break;

            case 'skills':
                this.addToHistory(`Technical Skills:

Languages:
• JavaScript/TypeScript
• Python
• SQL
• HTML/CSS

Frameworks & Libraries:
• React/Next.js
• Node.js/Express
• TailwindCSS
• MongoDB

Tools & Platforms:
• Git
• Docker
• AWS
• Figma`, 'output');
                break;
            
            case 'clear':
                this.history.innerHTML = '';
                break;
            
            default:
                this.addToHistory(`Command not found: ${command}. Type "help" for available commands.`, 'error');
        }
    }
}

// Initialize the terminal
new TerminalPortfolio();