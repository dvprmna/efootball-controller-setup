// Mapping DOM elements to Gamepad Buttons/Axes
const elements = {
    'A': document.getElementById('A'), 'B': document.getElementById('B'),
    'X': document.getElementById('X'), 'Y': document.getElementById('Y'),
    'L1': document.getElementById('L1'), 'R1': document.getElementById('R1'),
    'L2': document.getElementById('L2'), 'R2': document.getElementById('R2'),
    'LS': document.getElementById('LS'), 'RS': document.getElementById('RS'),
    'DPadUp': document.getElementById('DPadUp'), 'DPadDown': document.getElementById('DPadDown'),
    'DPadLeft': document.getElementById('DPadLeft'), 'DPadRight': document.getElementById('DPadRight'),
    'start': document.getElementById('start'), 'select': document.getElementById('select')
};

// Standard Mapping for PS/Xbox style controllers (Based on Gamepad Index)
const buttonMap = {
    0: 'A', 1: 'B', 2: 'X', 3: 'Y', 
    4: 'L1', 5: 'R1', 
    6: 'L2', 7: 'R2', 
    8: 'select', 9: 'start', 
    10: 'LS', 11: 'RS',
    // Fallback D-Pad for some controllers
    12: 'DPadUp', 13: 'DPadDown', 14: 'DPadLeft', 15: 'DPadRight'
};

const statusBar = document.getElementById('status-bar');
const statusText = document.getElementById('status-text');
const statusIcon = document.getElementById('status-icon');

let rAF = window.requestAnimationFrame || window.mozRequestAnimationFrame;
let rAFStop = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
let animationFrameId;

function updateStatus(gamepad) {
    if (gamepad) {
        statusBar.classList.add('connected');
        statusIcon.textContent = '🟢';
        statusText.textContent = `Gamepad Terdeteksi: ${gamepad.id} (${gamepad.mapping} mapping)`;
    } else {
        statusBar.classList.remove('connected');
        statusIcon.textContent = '🔴';
        statusText.textContent = 'Tidak Terdeteksi. Hubungkan Stik Anda.';
    }
}

function gameLoop() {
    let gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gamepad = null;

    // Cari Gamepad pertama yang terhubung
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            gamepad = gamepads[i];
            break; 
        }
    }

    // 1. Reset semua highlight
    Object.values(elements).forEach(el => el.classList.remove('active'));

    if (gamepad) {
        updateStatus(gamepad);

        // 2. Cek Tombol (Buttons)
        gamepad.buttons.forEach((button, index) => {
            const buttonName = buttonMap[index];
            // Cek jika tombol ditekan (pressed) atau memiliki nilai (value) > 0.5 (untuk trigger analog)
            if (buttonName && (button.pressed || button.value > 0.1)) {
                const el = elements[buttonName];
                if (el) {
                    el.classList.add('active');
                }
            }
        });

        // 3. Cek D-Pad (Axes 9/6 for some controllers, or Axis 0/1 with strict values)
        // Note: D-Pad is highly inconsistent. We use the standard button fallback (12-15) and common axis checks.
        
        // Axis check for D-Pad
        if (gamepad.axes.length > 9) {
            // Common D-Pad axis (Axis 9)
            const dpadAxisValue = gamepad.axes[9];
            if (dpadAxisValue > 0.5) { elements['DPadDown'].classList.add('active'); }
            else if (dpadAxisValue < -0.5) { elements['DPadUp'].classList.add('active'); }
        }
        
        // Cek Axis 0 dan 1 (Analog kiri/kanan) untuk pergerakan Stick.
        // LS (Axis 0 dan 1)
        if (Math.abs(gamepad.axes[0]) > 0.1 || Math.abs(gamepad.axes[1]) > 0.1) {
             elements['LS'].classList.add('active');
        }
        // RS (Axis 2 dan 3)
        if (Math.abs(gamepad.axes[2]) > 0.1 || Math.abs(gamepad.axes[3]) > 0.1) {
             elements['RS'].classList.add('active');
        }

    } else {
        updateStatus(null);
    }

    animationFrameId = rAF(gameLoop);
}

// --- Event Listeners untuk koneksi/diskoneksi Gamepad ---
window.addEventListener("gamepadconnected", (e) => {
    updateStatus(e.gamepad);
    if (!animationFrameId) {
        rAF(gameLoop); // Mulai loop
    }
});

window.addEventListener("gamepaddisconnected", (e) => {
    // Cari apakah masih ada gamepad yang terhubung
    const remainingGamepads = navigator.getGamepads().filter(g => g !== null);
    if (remainingGamepads.length === 0) {
        updateStatus(null);
        rAFStop(animationFrameId); // Hentikan loop jika tidak ada stik sama sekali
        animationFrameId = null;
    } else {
        // Jika masih ada, update status ke stik yang tersisa
        updateStatus(remainingGamepads[0]);
    }
});

// Coba mulai loop saat halaman dimuat jika stik sudah terhubung
if (navigator.getGamepads()[0]) {
    rAF(gameLoop);
}