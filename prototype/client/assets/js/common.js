// Global Front-end Javascript for Fathima Grocery Shop Prototype

document.addEventListener('DOMContentLoaded', () => {
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
  const asideElement = document.querySelector('aside.w-64');
  if (asideElement) {
    const navItems = [
      { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { name: 'Inventory', path: '/inventory', icon: 'inventory_2' },
      { name: 'Products', path: '/products', icon: 'shopping_basket' },
      { name: 'Sales', path: '/sales', icon: 'point_of_sale' },
      { name: 'Profit & Loss', path: '/profit-loss', icon: 'payments' },
      { name: 'Reports', path: '/reports', icon: 'assessment' }
    ];

    const currentPath = window.location.pathname;

    let asideHtml = `
      <div class="flex items-center gap-sm mb-lg">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <span class="material-symbols-outlined text-on-primary text-2xl" style="font-variation-settings: 'FILL' 1;">store</span>
        </div>
        <div class="flex flex-col">
          <h1 class="font-headline-md text-headline-md font-bold text-primary leading-none">Fathima Grocery</h1>
          <span class="font-body-sm text-body-sm text-on-surface-variant mt-1">Admin Portal</span>
        </div>
      </div>
      <nav class="flex flex-col gap-xs flex-grow">
    `;

    navItems.forEach(item => {
      const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
      const activeClass = isActive
        ? 'text-primary font-bold border-r-4 border-primary bg-surface-container dark:bg-surface-container-highest'
        : 'text-on-surface-variant hover:bg-surface-container transition-colors duration-200';

      asideHtml += `
        <a class="flex items-center gap-md p-md rounded-lg font-label-md text-label-md active:scale-95 transition-transform ${activeClass}" href="${item.path}">
          <span class="material-symbols-outlined" style="${isActive ? "font-variation-settings: 'FILL' 1;" : ''}">${item.icon}</span>
          <span>${item.name}</span>
        </a>
      `;
    });

    const isSettingsActive = currentPath === '/settings';
    const settingsClass = isSettingsActive
      ? 'text-primary font-bold border-r-4 border-primary bg-surface-container'
      : 'text-on-surface-variant hover:bg-surface-container transition-colors duration-200';

    asideHtml += `
        <div class="h-px bg-outline-variant/30 my-sm"></div>
        <a class="flex items-center gap-md p-md rounded-lg font-label-md text-label-md active:scale-95 transition-transform ${settingsClass}" href="/new-entry">
          <span class="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </a>
        <a class="flex items-center gap-md p-md rounded-lg font-label-md text-label-md text-error hover:bg-error-container/10 active:scale-95 transition-transform cursor-pointer" id="logout-sidebar-btn">
          <span class="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </a>
      </nav>

      <button id="sidebar-new-entry-btn" class="mt-auto bg-primary text-on-primary font-label-md text-label-md py-md px-lg rounded-xl flex items-center justify-center gap-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20">
        <span class="material-symbols-outlined">add</span>
        New Entry
      </button>

      <div class="flex items-center gap-md mt-lg pt-lg border-t border-outline-variant">
        <div class="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center overflow-hidden border-2 border-primary-container">
          <img class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYnkt8yiX5G-WZFzhVe9-ltdPN9LA7UsGrxUR6syBw8yGavocDQejTRAsNkOjmdSBisuOTZcM92d5dJPvVUMvp7OD8mlvIh6-D-ll9emNb0F30TnjhCpf2JK2KDjh9IZzmmTrr6BZuhCtT_iBRfaILEnDYv9j1QfvNNdll-dihBxypF1AiUYIblUkkgxDHHxbvT0s7y2qSlTEKUws3hbph_-47gbJVZyQRjytyzKIq418e2--l7v2zzg" alt="Fathima Rahman"/>
        </div>
        <div class="flex flex-col">
          <p class="font-label-md text-label-md text-on-surface">Fathima Rahman</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Store Manager</p>
        </div>
      </div>
    `;

    asideElement.innerHTML = asideHtml;

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
  const headerSettingsBtn = document.querySelector('header button span[data-icon="settings"], header span.text-primary:contains("settings")');
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
