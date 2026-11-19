/* Sinh tự động bởi tools/build-templates.js. Đừng sửa tay. */
window["LINK_TEMPLATES"] = {
  "classic": {
    "id": "classic",
    "name": "Classic",
    "description": "Profile trên cùng, danh sách link và card. Giống Linktree, hợp page ít nội dung.",
    "desktop": "center",
    "desktopColumns": 2,
    "regions": {
      "header": {
        "label": "Header",
        "allow": [
          "profile"
        ]
      },
      "hero": {
        "label": "Hero",
        "allow": [
          "hero-video",
          "banner",
          "release"
        ],
        "max": 1,
        "rank": false
      },
      "main": {
        "label": "Nội dung chính",
        "allow": [
          "card",
          "link",
          "carousel",
          "banner",
          "shop",
          "products",
          "video",
          "events",
          "release"
        ],
        "variants": [
          "list",
          "grid-2",
          "carousel"
        ],
        "defaultVariant": "list",
        "rank": true
      },
      "footer": {
        "label": "Footer",
        "allow": [
          "link",
          "subscribe",
          "banner"
        ],
        "rank": false
      }
    },
    "themeDefaults": {
      "bg": "#F7F7F7",
      "accent": "#CBD77E",
      "font": "Sora",
      "radius": 28,
      "button": "pill"
    }
  },
  "shop-grid": {
    "id": "shop-grid",
    "name": "Shop grid",
    "description": "Lưới sản phẩm 2 cột có thumbnail. Hợp page bán hàng nhiều sản phẩm.",
    "desktop": "grid",
    "desktopColumns": 3,
    "regions": {
      "header": {
        "label": "Header",
        "allow": [
          "profile"
        ]
      },
      "hero": {
        "label": "Hero",
        "allow": [
          "banner",
          "hero-video"
        ],
        "max": 1,
        "rank": false
      },
      "main": {
        "label": "Nội dung chính",
        "allow": [
          "card",
          "shop",
          "products",
          "carousel",
          "link",
          "banner"
        ],
        "variants": [
          "grid-2",
          "list"
        ],
        "defaultVariant": "grid-2",
        "rank": true
      },
      "footer": {
        "label": "Footer",
        "allow": [
          "link",
          "banner",
          "subscribe"
        ],
        "rank": false
      }
    },
    "themeDefaults": {
      "bg": "#F7F7F7",
      "accent": "#E6CA9A",
      "font": "Sora",
      "radius": 20,
      "button": "rounded"
    }
  },
  "video-first": {
    "id": "video-first",
    "name": "Video lên đầu",
    "description": "Video / release viral to nhất ở trên, sản phẩm vuốt ngang bên dưới. Hợp page TikTok.",
    "desktop": "split",
    "desktopColumns": 2,
    "regions": {
      "header": {
        "label": "Header",
        "allow": [
          "profile"
        ]
      },
      "hero": {
        "label": "Hero",
        "allow": [
          "hero-video",
          "video",
          "release"
        ],
        "max": 1,
        "rank": false
      },
      "main": {
        "label": "Nội dung chính",
        "allow": [
          "card",
          "carousel",
          "link",
          "shop",
          "products",
          "events",
          "video",
          "banner"
        ],
        "variants": [
          "carousel",
          "list",
          "grid-2"
        ],
        "defaultVariant": "carousel",
        "rank": true
      },
      "footer": {
        "label": "Footer",
        "allow": [
          "link",
          "subscribe"
        ],
        "rank": false
      }
    },
    "themeDefaults": {
      "bg": "#282828",
      "accent": "#CBD77E",
      "font": "Sora",
      "radius": 24,
      "button": "pill"
    }
  }
};
