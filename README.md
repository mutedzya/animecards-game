# AnimeCards — 100 Cards

100 cards across 10 series, 10 characters each.

Pack system:
- Start with 100 coins
- +100 coins once per calendar day
- 1 pack costs 10 coins
- 3 random cards per pack
- Every duplicate gives +5 coins
- Coins and collection are stored in localStorage

Images: the site automatically queries AniList and loads its image CDN URLs, so you do not need to download 100 images into the repository. You can override any card with a local image by adding an `image` field such as `characters/my-card.jpg`.

GitHub Pages: upload the files, then Settings → Pages → Deploy from branch → main → /(root).

Note: this is a client-side prototype. A real anti-cheat system needs a backend so users cannot edit coins/pack rolls in localStorage.
