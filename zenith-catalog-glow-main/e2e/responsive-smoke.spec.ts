import { expect, test, type Page, type Route } from "@playwright/test";

type MockState = ReturnType<typeof createMockState>;

const createToken = () =>
  Buffer.from(`1:admin@gadget69.com:${Date.now() + 60 * 60 * 1000}:1:signature`).toString("base64url");

const createMockState = () => ({
  token: createToken(),
  settings: {
    siteTitle: "Gadget69",
    metaDescription: "Premium electronics",
    logoUrl: "/placeholder.svg",
    faviconUrl: "/favicon.svg",
    catalogueUrl: "",
    footerText: "Premium electronics for everyday use.",
    announcementItems: ["Free shipping on select items", "Same-day dispatch on in-stock orders"],
    instagramUrl: "https://instagram.com/gadget69",
    whatsappNumber: "9999999999",
    shopPhone: "044-4000-4000",
    supportEmail: "support@gadget69.com",
    contactUrl: "/contact",
  },
  sections: [
    {
      id: 1,
      name: "Phones",
      description: "Flagship devices",
      imageUrl: "/placeholder.svg",
      is_active: true,
      show_in_explore: true,
      show_in_top_category: true,
      sort_order: 0,
    },
    {
      id: 2,
      name: "Audio",
      description: "Portable sound",
      imageUrl: "/placeholder.svg",
      is_active: true,
      show_in_explore: true,
      show_in_top_category: false,
      sort_order: 1,
    },
    {
      id: 3,
      name: "Wearables",
      description: "Smart accessories",
      imageUrl: "/placeholder.svg",
      is_active: true,
      show_in_explore: true,
      show_in_top_category: true,
      sort_order: 2,
    },
    {
      id: 4,
      name: "Android",
      description: "Android phones",
      imageUrl: "/placeholder.svg",
      is_active: true,
      show_in_explore: true,
      show_in_top_category: false,
      sort_order: 0,
      parentSectionId: 1,
      parentSectionName: "Phones",
    },
  ],
  banners: [
    {
      id: 1,
      title: "Launch Week",
      desktopImageUrl: "/placeholder.svg",
      mobileImageUrl: "/placeholder.svg",
      ctaText: "Shop Now",
      ctaLink: "/products",
      displayOrder: 0,
      isActive: true,
    },
  ],
  products: [
    {
      id: 1,
      name: "Atlas Pro",
      description: "Flagship device with all-day battery life.",
      price: 79999,
      stockQuantity: 6,
      sectionId: 1,
      sectionName: "Phones",
      imageUrl: "/placeholder.svg",
      media: [
        {
          id: 11,
          mediaUrl: "/placeholder.svg",
          mediaType: "IMAGE",
          mediaRole: "MAIN",
          displayOrder: 0,
          isPrimary: true,
        },
      ],
      galleryImages: [],
      model_number: "ATL-01",
      is_new_launch: true,
      is_best_seller: true,
      is_featured: true,
      is_hero_featured: false,
      offer: true,
      offerPrice: 74999,
      mrp: 82999,
      createdAt: "2026-04-10T10:00:00.000Z",
      status: "ACTIVE",
      specifications: {
        Display: "6.7 inch AMOLED",
        Battery: "5000 mAh",
      },
      variants: [],
    },
    {
      id: 2,
      name: "Pulse Speaker",
      description: "Portable speaker with rich bass.",
      price: 15999,
      stockQuantity: 12,
      sectionId: 2,
      sectionName: "Audio",
      imageUrl: "/placeholder.svg",
      media: [
        {
          id: 12,
          mediaUrl: "/placeholder.svg",
          mediaType: "IMAGE",
          mediaRole: "MAIN",
          displayOrder: 0,
          isPrimary: true,
        },
      ],
      galleryImages: [],
      model_number: "PLS-02",
      is_new_launch: false,
      is_best_seller: true,
      is_featured: false,
      is_hero_featured: false,
      offer: false,
      createdAt: "2026-04-09T10:00:00.000Z",
      status: "ACTIVE",
      specifications: {
        Battery: "18 hours",
      },
      variants: [],
    },
    {
      id: 3,
      name: "Orbit Watch",
      description: "Everyday smartwatch with wellness tracking.",
      price: 22999,
      stockQuantity: 9,
      sectionId: 3,
      sectionName: "Wearables",
      imageUrl: "/placeholder.svg",
      media: [
        {
          id: 13,
          mediaUrl: "/placeholder.svg",
          mediaType: "IMAGE",
          mediaRole: "MAIN",
          displayOrder: 0,
          isPrimary: true,
        },
      ],
      galleryImages: [],
      model_number: "ORB-03",
      is_new_launch: false,
      is_best_seller: false,
      is_featured: false,
      is_hero_featured: false,
      offer: false,
      createdAt: "2026-04-08T10:00:00.000Z",
      status: "ACTIVE",
      specifications: {
        Battery: "36 hours",
      },
      variants: [],
    },
  ],
  communityMedia: [
    {
      id: 1,
      title: "Store Reel",
      caption: "Behind the scenes",
      mediaType: "IMAGE",
      imageUrl: "/placeholder.svg",
      thumbnailUrl: "/placeholder.svg",
      actionLink: "/products",
      displayOrder: 0,
      isActive: true,
    },
  ],
  reviews: [
    {
      id: 1,
      name: "Asha",
      rating: 5,
      comment: "Fast delivery and premium finish.",
      avatar: "/placeholder.svg",
      date: "2026-04-12",
    },
  ],
  orders: [
    {
      id: 101,
      customerName: "Asha",
      phone: "9999999999",
      email: "asha@example.com",
      address: "12 Market Road",
      pincode: "600001",
      totalAmount: 74999,
      paymentStatus: "SUCCESS",
      orderStatus: "CONFIRMED",
      createdAt: "2026-04-12T10:00:00.000Z",
      updatedAt: "2026-04-12T11:00:00.000Z",
      items: [{ productId: 1, productName: "Atlas Pro", quantity: 1, price: 74999 }],
    },
  ],
  dashboard: {
    totalOrders: 24,
    paidOrders: 18,
    totalRevenue: 640000,
    conversionRate: 75,
    totalProducts: 3,
    totalSections: 3,
    totalBanners: 1,
    totalCommunityMedia: 1,
    topSellingProducts: [{ productId: 1, productName: "Atlas Pro", unitsSold: 8, revenue: 599992 }],
  },
});

const json = async (route: Route, data: unknown, status = 200) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(data),
  });
};

const findProduct = (state: MockState, productId: number) =>
  state.products.find((product) => product.id === productId);

const registerApiRoutes = async (page: Page, state: MockState) => {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (pathname === "/api/settings" || pathname === "/api/admin/settings") {
      if (method === "PUT") {
        state.settings = { ...state.settings, ...(request.postDataJSON() as Record<string, unknown>) };
      }
      await json(route, state.settings);
      return;
    }

    if (pathname === "/api/sections" || pathname === "/api/admin/sections") {
      if (method === "POST") {
        const nextSection = {
          id: state.sections.length + 1,
          ...(request.postDataJSON() as Record<string, unknown>),
        };
        state.sections.push(nextSection);
        await json(route, nextSection);
        return;
      }
      await json(route, state.sections);
      return;
    }

    if (pathname.startsWith("/api/admin/sections/")) {
      const sectionId = Number(pathname.split("/").pop());
      if (method === "PUT") {
        const patch = request.postDataJSON() as Record<string, unknown>;
        state.sections = state.sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section
        );
        await json(route, state.sections.find((section) => section.id === sectionId));
        return;
      }
      if (method === "DELETE") {
        state.sections = state.sections.filter((section) => section.id !== sectionId);
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (pathname === "/api/banners" || pathname === "/api/admin/banners") {
      if (method === "POST") {
        const nextBanner = {
          id: state.banners.length + 1,
          ...(request.postDataJSON() as Record<string, unknown>),
        };
        state.banners.push(nextBanner);
        await json(route, nextBanner);
        return;
      }
      await json(route, state.banners);
      return;
    }

    if (pathname.startsWith("/api/admin/banners/")) {
      const bannerId = Number(pathname.split("/").pop());
      if (method === "PUT") {
        const patch = request.postDataJSON() as Record<string, unknown>;
        state.banners = state.banners.map((banner) =>
          banner.id === bannerId ? { ...banner, ...patch } : banner
        );
        await json(route, state.banners.find((banner) => banner.id === bannerId));
        return;
      }
      if (method === "DELETE") {
        state.banners = state.banners.filter((banner) => banner.id !== bannerId);
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (pathname === "/api/products" || pathname === "/api/admin/products") {
      if (method === "POST") {
        const nextProduct = {
          id: state.products.length + 1,
          ...(request.postDataJSON() as Record<string, unknown>),
          sectionName:
            state.sections.find((section) => section.id === (request.postDataJSON() as Record<string, number>).sectionId)?.name ||
            "Uncategorized",
          variants: [],
        };
        state.products.push(nextProduct);
        await json(route, nextProduct);
        return;
      }
      await json(route, state.products);
      return;
    }

    if (/^\/api\/products\/\d+$/.test(pathname)) {
      const productId = Number(pathname.split("/").pop());
      await json(route, findProduct(state, productId));
      return;
    }

    if (/^\/api\/admin\/products\/\d+$/.test(pathname)) {
      const productId = Number(pathname.split("/").pop());
      if (method === "PUT") {
        const patch = request.postDataJSON() as Record<string, unknown>;
        state.products = state.products.map((product) =>
          product.id === productId ? { ...product, ...patch } : product
        );
        await json(route, findProduct(state, productId));
        return;
      }
      if (method === "DELETE") {
        state.products = state.products.filter((product) => product.id !== productId);
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (/^\/api\/admin\/products\/\d+\/variants$/.test(pathname)) {
      const productId = Number(pathname.split("/")[4]);
      await json(route, findProduct(state, productId)?.variants || []);
      return;
    }

    if (pathname === "/api/community-media" || pathname === "/api/admin/community-media") {
      if (method === "POST") {
        const nextItem = {
          id: state.communityMedia.length + 1,
          ...(request.postDataJSON() as Record<string, unknown>),
        };
        state.communityMedia.push(nextItem);
        await json(route, nextItem);
        return;
      }
      await json(route, state.communityMedia);
      return;
    }

    if (pathname.startsWith("/api/admin/community-media/")) {
      const mediaId = Number(pathname.split("/").pop());
      if (method === "PUT") {
        const patch = request.postDataJSON() as Record<string, unknown>;
        state.communityMedia = state.communityMedia.map((item) =>
          item.id === mediaId ? { ...item, ...patch } : item
        );
        await json(route, state.communityMedia.find((item) => item.id === mediaId));
        return;
      }
      if (method === "DELETE") {
        state.communityMedia = state.communityMedia.filter((item) => item.id !== mediaId);
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (pathname === "/api/reviews" || pathname === "/api/admin/reviews") {
      await json(route, state.reviews);
      return;
    }

    if (pathname === "/api/admin/dashboard") {
      await json(route, state.dashboard);
      return;
    }

    if (pathname === "/api/admin/orders") {
      await json(route, { items: state.orders });
      return;
    }

    if (/^\/api\/admin\/orders\/\d+$/.test(pathname)) {
      const orderId = Number(pathname.split("/").pop());
      await json(route, state.orders.find((order) => order.id === orderId));
      return;
    }

    if (/^\/api\/admin\/orders\/\d+\/status$/.test(pathname)) {
      const orderId = Number(pathname.split("/")[4]);
      const patch = request.postDataJSON() as { orderStatus: string };
      state.orders = state.orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: patch.orderStatus } : order
      );
      await json(route, state.orders.find((order) => order.id === orderId));
      return;
    }

    if (/^\/api\/admin\/orders\/\d+\/details$/.test(pathname)) {
      const orderId = Number(pathname.split("/")[4]);
      const patch = request.postDataJSON() as Record<string, unknown>;
      state.orders = state.orders.map((order) =>
        order.id === orderId ? { ...order, ...patch } : order
      );
      await json(route, state.orders.find((order) => order.id === orderId));
      return;
    }

    if (pathname === "/api/admin/login" && method === "POST") {
      await json(route, { token: state.token });
      return;
    }

    await json(route, {});
  });
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBeFalsy();
};

const loginAsAdmin = async (page: Page) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  await page.locator("#email").fill("admin@gadget69.com");
  await page.locator("#password").fill("secret-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
};

test.beforeEach(async ({ page }) => {
  const state = createMockState();
  await registerApiRoutes(page, state);
});

test("public storefront flows remain responsive across devices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "New Launches" })).toBeVisible();
  const homeSectionHeadings = page.locator("section h2");
  await expect(homeSectionHeadings.filter({ hasText: /^Explore Categories$/ })).toBeVisible();
  await expect(homeSectionHeadings.filter({ hasText: /^Featured Picks$/ })).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo({ top: Math.max(window.innerHeight * 2, document.body.scrollHeight / 2) });
  });
  await expect(homeSectionHeadings.filter({ hasText: /^Featured Picks$/ })).toBeVisible({ timeout: 15_000 });
  const headingLayout = await homeSectionHeadings.evaluateAll((elements) =>
    elements.map((element) => ({
      text: element.textContent?.trim() || "",
      top: element.getBoundingClientRect().top + window.scrollY,
    }))
  );
  const findHeading = (text: string) => headingLayout.find((entry) => entry.text === text);
  expect(findHeading("Explore Categories")?.top ?? -1).toBeGreaterThanOrEqual(0);
  expect(findHeading("New Launches")?.top ?? -1).toBeGreaterThan(findHeading("Explore Categories")?.top ?? -1);
  expect(findHeading("Featured Picks")?.top ?? -1).toBeGreaterThan(findHeading("New Launches")?.top ?? -1);
  await expect(page.locator('a[href="/products/1"] h3').first()).toContainText("Atlas Pro");
  await expectNoHorizontalOverflow(page);

  if ((page.viewportSize()?.width || 0) < 768) {
    await page.getByLabel(/open menu/i).click();
    await expect(page.getByRole("link", { name: "Categories" }).last()).toBeVisible();
  }

  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
  await expect(page.locator('a[href="/products/1"] h3').first()).toContainText("Atlas Pro");
  await expectNoHorizontalOverflow(page);

  await page.goto("/products/1");
  await expect(page.getByRole("heading", { name: "Atlas Pro" })).toBeVisible();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await expect(page.getByText(/cart \(1\)/i)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/track-order");
  await expect(page.getByRole("heading", { name: "Track your Gadget69 order" })).toBeVisible();
  await expect(page.getByPlaceholder("12345")).toBeVisible();
  await expect(page.getByPlaceholder("+91 98765 43210")).toBeVisible();
  await expect(page.getByRole("button", { name: "Track Order" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("admin login, orders, and editor flows remain usable across devices", async ({ page }) => {
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Order Management" })).toBeVisible();
  await page.getByRole("button", { name: "View" }).click();
  await expect(page.getByRole("dialog")).toContainText("Order #101");
  await expectNoHorizontalOverflow(page);
  await page.keyboard.press("Escape");

  await page.goto("/admin/categories");
  await page.getByRole("button", { name: /add main category/i }).click();
  const categoryDialog = page.getByRole("dialog");
  await categoryDialog.getByRole("textbox").nth(0).fill("Tablets");
  await categoryDialog.getByRole("textbox").nth(1).fill("Portable work and play");
  await categoryDialog.getByRole("textbox").nth(2).fill("/placeholder.svg");
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("row", { name: /tablets tablets category/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page
    .getByRole("button", { name: /view subcategories for tablets, 0 subcategories/i })
    .click();
  const subcategoryDialog = page.getByRole("dialog", { name: /subcategories - tablets/i });
  await expect(subcategoryDialog.getByRole("button", { name: /add subcategory/i })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await subcategoryDialog.getByRole("button", { name: /add subcategory/i }).click();
  const subcategoryForm = page.getByRole("dialog", { name: /add subcategory under tablets/i });
  await subcategoryForm.getByRole("textbox").nth(0).fill("Tablet Cases");
  await subcategoryForm.getByRole("textbox").nth(1).fill("Protection and stands");
  await subcategoryForm.getByRole("textbox").nth(2).fill("/placeholder.svg");
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("dialog", { name: /subcategories - tablets/i })).toContainText("Tablet Cases");
  await page.keyboard.press("Escape");

  await page.goto("/admin/products");
  await page.getByRole("button", { name: /add product/i }).click();
  const productDialog = page.getByRole("dialog");
  await productDialog.getByRole("textbox").nth(0).fill("Orbit Tablet");
  await productDialog.getByRole("spinbutton").nth(0).fill("45999");
  await productDialog.getByRole("spinbutton").nth(2).fill("8");
  await productDialog.getByRole("textbox").nth(2).fill("Designed for work, streaming, and travel.");
  await page.getByRole("button", { name: /create product/i }).click();
  await expect(page.getByRole("dialog")).toContainText("Orbit Tablet");
  await expect(productDialog.getByRole("button", { name: /^close$/i }).first()).toBeVisible();

  await page.goto("/admin/media");
  await page.getByRole("button", { name: /add media/i }).click();
  const mediaDialog = page.getByRole("dialog");
  await mediaDialog.getByRole("textbox").nth(0).fill("Studio Reel");
  await mediaDialog.getByRole("textbox").nth(1).fill("Fast-paced reel for the launch page");
  await mediaDialog.getByRole("textbox").nth(2).fill("/placeholder.svg");
  await mediaDialog.getByRole("textbox").nth(3).fill("/placeholder.svg");
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByText("Studio Reel")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
