// Global Front-end Javascript for Fathima Grocery Shop Prototype

// Apply stored sidebar state immediately to prevent layout shifts
(function() {
  if (localStorage.getItem('sidebar_minimized') === 'true') {
    document.documentElement.classList.add('sidebar-minimized');
    if (document.body) {
      document.body.classList.add('sidebar-minimized');
    }
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Inject global sidebar styles for smooth min/max transitions
  if (!document.getElementById('sidebar-dynamic-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'sidebar-dynamic-styles';
    styleEl.textContent = `
      /* Smooth transitions for main sidebar, header, and content */
      aside.fixed, aside#main-sidebar, aside.app-sidebar, header, main, .ml-64, .pl-64, .left-64 {
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                    margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                    padding 0.25s cubic-bezier(0.4, 0, 0.2, 1), 
                    left 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      /* Minimized Sidebar Layout (Only affects the main fixed navigation sidebar) */
      body.sidebar-minimized aside.fixed,
      html.sidebar-minimized aside.fixed,
      body.sidebar-minimized aside#main-sidebar,
      html.sidebar-minimized aside#main-sidebar,
      body.sidebar-minimized aside.app-sidebar,
      html.sidebar-minimized aside.app-sidebar {
        width: 5rem !important; /* 80px */
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }

      body.sidebar-minimized header.ml-64,
      html.sidebar-minimized header.ml-64,
      body.sidebar-minimized main.ml-64,
      html.sidebar-minimized main.ml-64,
      body.sidebar-minimized .ml-64,
      html.sidebar-minimized .ml-64 {
        margin-left: 5rem !important;
      }

      body.sidebar-minimized header.left-64,
      html.sidebar-minimized header.left-64,
      body.sidebar-minimized .left-64,
      html.sidebar-minimized .left-64 {
        left: 5rem !important;
      }

      /* Hide text elements in minimized mode */
      body.sidebar-minimized .sidebar-text,
      html.sidebar-minimized .sidebar-text,
      body.sidebar-minimized .brand-details,
      html.sidebar-minimized .brand-details,
      body.sidebar-minimized .user-details,
      html.sidebar-minimized .user-details,
      body.sidebar-minimized .new-entry-text,
      html.sidebar-minimized .new-entry-text,
      body.sidebar-minimized .sidebar-minmax-label,
      html.sidebar-minimized .sidebar-minmax-label {
        display: none !important;
      }

      /* Center items in minimized mode */
      body.sidebar-minimized .nav-item-link,
      html.sidebar-minimized .nav-item-link {
        justify-content: center !important;
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
      }

      body.sidebar-minimized .sidebar-brand-container,
      html.sidebar-minimized .sidebar-brand-container,
      body.sidebar-minimized .sidebar-minmax-section,
      html.sidebar-minimized .sidebar-minmax-section {
        justify-content: center !important;
      }

      body.sidebar-minimized #sidebar-toggle-minmax-btn,
      html.sidebar-minimized #sidebar-toggle-minmax-btn {
        justify-content: center !important;
        padding: 0.5rem !important;
        width: 100% !important;
      }

      body.sidebar-minimized #sidebar-new-entry-btn,
      html.sidebar-minimized #sidebar-new-entry-btn {
        padding-left: 0.5rem !important;
        padding-right: 0.5rem !important;
        justify-content: center !important;
      }

      body.sidebar-minimized .user-profile-card,
      html.sidebar-minimized .user-profile-card {
        justify-content: center !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Ensure body has class if html had it
  if (document.documentElement.classList.contains('sidebar-minimized')) {
    document.body.classList.add('sidebar-minimized');
  }

  // 1. Authentication Guard
  const token = localStorage.getItem('token');
  const path = window.location.pathname;
  const isLoginPage = path === '/' || path === '/login' || path.endsWith('/login/index.html');

  if (!token && !isLoginPage) {
    window.location.href = '/login';
    return;
  }

  if (token) {
    // Verify token with backend
    fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Token expired or invalid');
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        // Sync profile UI if elements exist
        const profileName = document.querySelector('aside p.font-label-md');
        if (profileName) {
          profileName.textContent = data.user.username === 'admin' ? 'Fathima Rahman' : data.user.username;
        }
      }
    })
    .catch(err => {
      console.error(err);
      localStorage.removeItem('token');
      if (!isLoginPage) {
        window.location.href = '/login';
      }
    });
  }

  // 2. Dynamic Navigation Builder (Standardizes Sidebar across all pages)
  const asideElement = document.querySelector('aside.w-64') || document.querySelector('aside.fixed') || document.querySelector('aside#main-sidebar');
  if (asideElement) {
    asideElement.id = 'main-sidebar';
    asideElement.classList.add('app-sidebar');
    const navItems = [
      { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { name: 'Inventory', path: '/inventory', icon: 'inventory_2' },
      { name: 'Products', path: '/products', icon: 'shopping_basket' },
      { name: 'Sales', path: '/sales', icon: 'point_of_sale' },
      { name: 'Profit & Loss', path: '/profit-loss', icon: 'payments' },
      { name: 'Reports', path: '/reports', icon: 'assessment' }
    ];

    const currentPath = window.location.pathname;
    const isMinimized = document.body.classList.contains('sidebar-minimized');

    let asideHtml = `
      <!-- Brand & Admin Portal Header -->
      <div class="flex items-center gap-sm mb-1 sidebar-brand-container">
        <a href="/dashboard" class="w-10 h-10 min-w-[2.5rem] bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity" title="Fathima Grocery Shop">
          <span class="material-symbols-outlined text-on-primary text-2xl" style="font-variation-settings: 'FILL' 1;">store</span>
        </a>
        <div class="flex flex-col brand-details overflow-hidden">
          <h1 class="font-headline-md text-headline-md font-bold text-primary leading-none truncate">Fathima Grocery</h1>
          <span class="font-body-sm text-body-sm text-on-surface-variant mt-1 truncate">Admin Portal</span>
        </div>
      </div>

      <!-- SIDEBAR MIN/MAX BUTTON (Simple Icon Only) -->
      <div class="sidebar-minmax-section my-1.5 flex items-center justify-end">
        <button id="sidebar-toggle-minmax-btn" type="button" class="p-1.5 rounded-lg bg-surface-container/60 hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all duration-200 border border-outline-variant/30 shadow-xs cursor-pointer flex items-center justify-center group" title="${isMinimized ? 'Maximize Sidebar' : 'Minimize Sidebar'}" aria-label="Toggle Sidebar Size">
          <span id="sidebar-toggle-icon" class="material-symbols-outlined text-lg text-primary/80 group-hover:text-primary transition-transform duration-200">${isMinimized ? 'left_panel_open' : 'left_panel_close'}</span>
        </button>
      </div>

      <!-- Navigation List starting with Dashboard -->
      <nav class="flex flex-col gap-xs flex-grow">
    `;

    navItems.forEach(item => {
      const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
      const activeClass = isActive
        ? 'text-primary font-bold border-r-4 border-primary bg-surface-container dark:bg-surface-container-highest'
        : 'text-on-surface-variant hover:bg-surface-container transition-colors duration-200';

      asideHtml += `
        <a class="nav-item-link flex items-center gap-md p-md rounded-lg font-label-md text-label-md active:scale-95 transition-transform ${activeClass}" href="${item.path}" title="${item.name}">
          <span class="material-symbols-outlined flex-shrink-0" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">${item.icon}</span>
          <span class="sidebar-text truncate">${item.name}</span>
        </a>
      `;
    });

    const isSettingsActive = currentPath === '/settings';
    const settingsClass = isSettingsActive
      ? 'text-primary font-bold border-r-4 border-primary bg-surface-container'
      : 'text-on-surface-variant hover:bg-surface-container transition-colors duration-200';

    asideHtml += `
        <div class="h-px bg-outline-variant/30 my-sm"></div>
        <a class="nav-item-link flex items-center gap-md p-md rounded-lg font-label-md text-label-md active:scale-95 transition-transform ${settingsClass}" href="/new-entry" title="Settings / Quick Setup">
          <span class="material-symbols-outlined flex-shrink-0">settings</span>
          <span class="sidebar-text truncate">Settings</span>
        </a>
        <a class="nav-item-link flex items-center gap-md p-md rounded-lg font-label-md text-label-md text-error hover:bg-error-container/10 active:scale-95 transition-transform cursor-pointer" id="logout-sidebar-btn" title="Logout">
          <span class="material-symbols-outlined flex-shrink-0">logout</span>
          <span class="sidebar-text truncate">Logout</span>
        </a>
      </nav>

      <!-- New Entry Action -->
      <button id="sidebar-new-entry-btn" class="mt-auto bg-primary text-on-primary font-label-md text-label-md py-md px-lg rounded-xl flex items-center justify-center gap-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 cursor-pointer" title="Create New Entry">
        <span class="material-symbols-outlined flex-shrink-0">add</span>
        <span class="new-entry-text sidebar-text whitespace-nowrap">New Entry</span>
      </button>

      <!-- User Profile Card -->
      <div class="user-profile-card flex items-center gap-md mt-lg pt-lg border-t border-outline-variant">
        <div class="w-10 h-10 min-w-[2.5rem] rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden border-2 border-primary-container flex-shrink-0" title="Store Manager">
          <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYnkt8yiX5G-WZFzhVe9-ltdPN9LA7UsGrxUR6syBw8yGavocDQejTRAsNkOjmdSBisuOTZcM92d5dJPvVUMvp7OD8mlvIh6-D-ll9emNb0F30TnjhCpf2JK2KDjh9IZzmmTrr6BZuhCtT_iBRfaILEnDYv9j1QfvNNdll-dihBxypF1AiUYIblUkkgxDHHxbvT0s7y2qSlTEKUws3hbph_-47gbJVZyQRjytyzKIq418e2--l7v2zzg" alt="Fathima Rahman"/>
        </div>
        <div class="flex flex-col user-details overflow-hidden">
          <p class="font-label-md text-label-md text-on-surface truncate">Fathima Rahman</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant truncate">Store Manager</p>
        </div>
      </div>
    `;

    asideElement.innerHTML = asideHtml;

    // Attach Sidebar Min/Max Toggle Event
    const sidebarToggleMinMaxBtn = document.getElementById('sidebar-toggle-minmax-btn');
    if (sidebarToggleMinMaxBtn) {
      sidebarToggleMinMaxBtn.addEventListener('click', toggleSidebarSize);
    }

    // Attach logout event
    const logoutBtn = document.getElementById('logout-sidebar-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    // Attach new entry event
    const newEntryBtn = document.getElementById('sidebar-new-entry-btn');
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', () => {
        window.location.href = '/new-entry';
      });
    }
  }

  // 3. Header Sidebar Min/Max Toggle Button Integration
  const headerElement = document.querySelector('header');
  if (headerElement && !document.getElementById('header-sidebar-toggle-btn')) {
    const leftContainer = headerElement.firstElementChild;
    if (leftContainer) {
      const headerToggleBtn = document.createElement('button');
      headerToggleBtn.id = 'header-sidebar-toggle-btn';
      headerToggleBtn.type = 'button';
      headerToggleBtn.className = 'p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all flex items-center justify-center mr-2 cursor-pointer';
      headerToggleBtn.title = 'Toggle Sidebar (Min/Max)';
      headerToggleBtn.setAttribute('aria-label', 'Toggle Sidebar Size');
      headerToggleBtn.innerHTML = `<span class="material-symbols-outlined text-2xl">menu</span>`;
      headerToggleBtn.addEventListener('click', toggleSidebarSize);
      leftContainer.prepend(headerToggleBtn);
    }
  }

  // 4. Header Breadcrumbs / Title Mapping
  const headerShopTitle = document.querySelector('header h2');
  if (headerShopTitle) {
    headerShopTitle.innerHTML = `<a href="/dashboard" class="hover:underline">Fathima Grocery Shop</a>`;
  }

  // 5. Header Search Handling
  const headerSearchInput = document.querySelector('header input');
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) {
          // If on products page, trigger local search, otherwise redirect
          if (window.location.pathname === '/products' && typeof loadProducts === 'function') {
            loadProducts(1, query);
          } else {
            window.location.href = `/products?search=${encodeURIComponent(query)}`;
          }
        }
      }
    });
  }

  // 6. Settings Header Button
  const settingsSelector = document.querySelectorAll('header span.material-symbols-outlined');
  settingsSelector.forEach(icon => {
    if (icon.textContent === 'settings') {
      icon.parentElement.style.cursor = 'pointer';
      icon.parentElement.addEventListener('click', () => {
        window.location.href = '/new-entry';
      });
    }
  });

  // 7. Inject Toast Container
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed bottom-lg right-lg z-[9999] flex flex-col gap-sm max-w-sm';
    document.body.appendChild(container);
  }
});

// Toggle Sidebar Min/Max function
function toggleSidebarSize() {
  const isCurrentlyMinimized = document.body.classList.contains('sidebar-minimized');
  const nextMinimized = !isCurrentlyMinimized;

  if (nextMinimized) {
    document.body.classList.add('sidebar-minimized');
    document.documentElement.classList.add('sidebar-minimized');
    localStorage.setItem('sidebar_minimized', 'true');
  } else {
    document.body.classList.remove('sidebar-minimized');
    document.documentElement.classList.remove('sidebar-minimized');
    localStorage.setItem('sidebar_minimized', 'false');
  }

  // Update toggle button icon and title
  const toggleIcon = document.getElementById('sidebar-toggle-icon');
  const toggleBtn = document.getElementById('sidebar-toggle-minmax-btn');
  if (toggleIcon) {
    toggleIcon.textContent = nextMinimized ? 'left_panel_open' : 'left_panel_close';
  }
  if (toggleBtn) {
    toggleBtn.title = nextMinimized ? 'Maximize Sidebar (Expand)' : 'Minimize Sidebar (Collapse)';
  }
}

// Global Logout Action
function logout() {
  localStorage.removeItem('token');
  showToast('Logged out successfully', 'info');
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
}

// Global Toast System
// type: 'success' (green), 'error' (red), 'info' (blue)
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  let bgClass = 'bg-primary text-on-primary'; // default green
  let icon = 'check_circle';

  if (type === 'error') {
    bgClass = 'bg-error text-on-error';
    icon = 'error';
  } else if (type === 'info') {
    bgClass = 'bg-surface-container text-primary border border-primary';
    icon = 'info';
  }

  toast.className = `flex items-center gap-md py-md px-lg rounded-xl shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 ${bgClass}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined">${icon}</span>
    <span class="font-label-md text-label-md">${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Remove after 3.5s
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Helper to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

