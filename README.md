# NeuroTetris ✨

[![Language](https://img.shields.io/badge/language-Node.js-blue.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Developed with AI](https://img.shields.io/badge/Developed%20with-AI%20Assistant-lightblue.svg)](https://gemini.google.com/)

A simple yet engaging command-line Tetris clone built with Node.js and the amazing `blessed` terminal library.

---

<div align="center">

```
 _______ _______ _______ _______ _______ _______ _______ _______ _______ _______ _______ 
|       |       |       |       |       |       |       |       |       |       |       |
|   N   |   E   |   U   |   R   |   O   |   T   |   E   |   T   |   R   |   I   |   S   |
|_______|_______|_______|_______|_______|_______|_______|_______|_______|_______|_______|
```

</div>

<img src="neurotetris.gif" alt="NeuroTetris Demo" style="display: block; margin-left: auto; margin-right: auto; width:30%;" />

NeuroTetris brings the classic block-stacking puzzle game to your terminal. Perfect for a quick break or honing your spatial skills!

## ✨ Features

*   Classic Tetris gameplay mechanics.
*   Movement (Left, Right, Soft Drop).
*   Rotation (Clockwise).
*   Hard Drop (Instant placement).
*   Line Clearing (Single and multiple lines).
*   Basic Scoring (Bonus for multiple lines cleared at once).
*   Game Over detection.
*   Restart functionality.
*   Clean terminal interface using `blessed`.

## 🚀 Getting Started

### Prerequisites

*   **Node.js**: v12 or later recommended.
*   **npm**: Usually included with Node.js.

### Installation

1.  Clone the repository (or download `index.js`):
    ```bash
    # git clone <repository-url> # If you put this on GitHub
    # cd neurotetris
    ```
2.  Install dependencies from the project directory:
    ```bash
    npm install blessed
    ```

### Running the Game

Start the game using Node:

```bash
node index.js
```

## 🎮 Controls

| Key             | Action         |
| --------------- | -------------- |
| Left Arrow / `h` | Move Left      |
| Right Arrow / `l`| Move Right     |
| Down Arrow / `j` | Soft Drop      |
| Up Arrow / `k`   | Rotate         |
| Spacebar        | Hard Drop      |
| `r` / `R`       | Restart Game   |
| `Esc`, `q`, `Ctrl+C` | Quit Game      |

## 🔮 Future Enhancements

*   [ ] Score display during gameplay.
*   [ ] Level system with increasing speed.
*   [ ] Preview of the next piece.
*   [ ] Hold piece functionality.
*   [ ] Wall kicks for rotation.
*   [ ] Ghost piece (showing where the piece will land).
*   [ ] Colorized pieces.
*   [ ] Persistent high score storage.

## 🤖 AI Generation Note

This project was bootstrapped and developed with significant assistance from an AI coding assistant (Google Gemini within the Codex CLI environment). It serves as an example of human-AI collaboration in software development.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file (if you choose to add one) for details.

