const productionHostnames = [
  'worldclocks.it.com',
  'ko.worldclocks.it.com' 
];
const previewParam = 'mode';
const previewValue = 'preview';
const previewSessionKey = 'worldclocksPreviewMode';

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

let isInPreviewMode = false;
const urlPreviewParam = getQueryParam(previewParam);

if (urlPreviewParam === previewValue) {
  try {
    sessionStorage.setItem(previewSessionKey, 'true');
    isInPreviewMode = true;
    console.log('WorldClocks: Preview mode activated via URL parameter and saved to session.');
  } catch (e) {
    console.error('WorldClocks: Session storage is not available or failed:', e);
    isInPreviewMode = true; 
  }
} else {
  try {
    if (sessionStorage.getItem(previewSessionKey) === 'true') {
      isInPreviewMode = true;
      console.log('WorldClocks: Preview mode active via session storage.');
    }
  } catch (e) {
    console.error('WorldClocks: Session storage is not available or failed:', e);
  }
}

const isProduction = productionHostnames.includes(window.location.hostname);

if (isProduction && !isInPreviewMode) {
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-EPCXS5MFDV';
  document.head.appendChild(gaScript);

  const gaInitScript = document.createElement('script');
  gaInitScript.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-EPCXS5MFDV');
  `;
  document.head.appendChild(gaInitScript);
  console.log('WorldClocks: Google Analytics loaded for production.');

  const adSenseScript = document.createElement('script');
  adSenseScript.async = true;
  adSenseScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6076627813468062';
  adSenseScript.crossOrigin = 'anonymous';
  document.head.appendChild(adSenseScript);
  console.log('WorldClocks: Google AdSense loaded for production.');

} else {
  console.log('WorldClocks: Analytics and AdSense skipped for:', window.location.hostname, isInPreviewMode ? '(Preview Mode Active)' : '');

  if (isInPreviewMode) {
    document.addEventListener('DOMContentLoaded', () => {
      const adPlaceholders = document.querySelectorAll('.adsbygoogle, .ad-placeholder, [data-ad-slot]');
      adPlaceholders.forEach(el => {
        el.style.display = 'none';
        if (el.classList.contains('adsbygoogle') && el.style.insStyle) {
            el.style.setProperty('display', 'none', 'important');
        }
      });
      console.log('WorldClocks: Attempted to hide ad placeholders for preview mode.');
    });
  }
}

if (urlPreviewParam === 'exitpreview') {
    try {
        sessionStorage.removeItem(previewSessionKey);
        console.log('WorldClocks: Preview mode session flag removed.');
    } catch (e) {
        console.error('WorldClocks: Session storage is not available or failed:', e);
    }
}

async function loadHTML(url, containerId, isCritical = false) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container element with ID '${containerId}' not found.`);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        const data = await response.text();
        container.innerHTML = data;
        console.log(`${url} loaded into #${containerId}`);
    } catch (error) {
        console.error(`Error loading HTML from ${url} into #${containerId}:`, error);
        if (isCritical) {
            container.innerHTML = `<p>Error loading critical content from ${url}. Please try again later.</p>`;
        } else {
            container.innerHTML = `<p>Error loading content from ${url}.</p>`;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadHTML('/navbar.html', 'navbar-container', true);
    initializeHamburger(); 
    setActiveNavLink();    

    await loadHTML('/footer.html', 'footer-container');

    function initializeHamburger() {
        const hamburger = document.querySelector("#navbar-container .hamburger");
        const navUl = document.querySelector("#navbar-container nav ul");
        if (hamburger && navUl) {
            navUl.classList.remove("active"); 
            hamburger.addEventListener("click", () => {
                navUl.classList.toggle("active");
                console.log("Hamburger clicked, nav active:", navUl.classList.contains("active"));
            });
            console.log("Hamburger menu initialized.");
        } else {
            console.warn("Hamburger or navUl not found. Ensure #navbar-container is populated before calling initializeHamburger.");
        }
    }

    function setActiveNavLink() {
        const navLinks = document.querySelectorAll("#navbar-container nav ul li a");
        if (navLinks.length === 0) {
            console.warn("No navigation links found for setting active state. Ensure #navbar-container is populated.");
            return;
        }
        navLinks.forEach(link => {
            if (link.href === window.location.href) {
                link.classList.add("active");
            }
        });
        console.log("Active navigation link set.");
    }
});

window.onload = () => { 
    const fontAwesomeLoaded = document.querySelector('link[href*="fontawesome"]') || document.querySelector('link[href*="cdnjs"]');
    if (!fontAwesomeLoaded) {
    }

    const themes = [
        { name: 'light', icon: 'fa-sun' },
        { name: 'dark', icon: 'fa-moon' },
        { name: 'pastel', icon: 'fa-cloud' },
        { name: 'light-pink', icon: 'fa-heart' } // 연핑크 테마 추가 (아이콘은 예시입니다)
    ];
    let currentThemeIndex = 0;

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const body = document.body;

    if (!themeToggleBtn || !themeIcon || !body) {
        return;
    }

    try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const savedThemeIndex = themes.findIndex(theme => theme.name === savedTheme);
            if (savedThemeIndex !== -1) {
                currentThemeIndex = savedThemeIndex;
            body.className = themes[currentThemeIndex].name + '-theme'; // CSS 클래스명은 'light-pink-theme'
                themeIcon.className = 'fas ' + themes[currentThemeIndex].icon;
            }
        }
    } catch (e) {
    }

    themeToggleBtn.addEventListener('click', () => {
        try {
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            const newTheme = themes[currentThemeIndex];

            body.className = newTheme.name + '-theme'; // CSS 클래스명은 'light-pink-theme'
            themeIcon.className = 'fas ' + newTheme.icon;

            localStorage.setItem('theme', newTheme.name);
        } catch (e) {
        }
    });
};
