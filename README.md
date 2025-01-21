# A completely static blog website with react-router v7

This repository is an example for building a static, frequently updated website (like a blog) using React Router v7, with support for writing articles in Markdown.
The focus is on creating a setup minimizes manual maintenance while maintaining the flexibility of React Router.

To get started, run the following command:

```sh
npx create-react-router@latest --template Geb-algebra/rrv7-markdown-static-website
```

## Key Features

### Completely static

Once built, the site can be deployed by simply uploading the build/client folder to any static hosting service, such as Cloudflare Pages or AWS S3. There’s no need for a server.

This approach is Cost-Effective.
Hosting static assets on services like Cloudflare Pages is often free, making this ideal for websites without server-side dynamic features.

While taking advantage of the benefit, you can enjoy react-router's great DX and extensibility.
You can define layouts to reduce code duplication.
You can also add any contents other than simple blog posts.
And if these contents require server, you can smoothly add it.

### No maintenance required on adding article

Adding a new article is as simple as creating a `app/contents/{article-slug}/page.mdx` file and writing the content. There's no need to manually update other files like `postlist.tsx` or `routes.ts`, and no additional route modules are required.

Without this approach, the easiest approach to create static sites with RRv7 would be to use `page.mdx` files as route modules.

```
├── routes
│   ├── postlist.tsx
│   ├── my-first-article.mdx    👈 route modules for /my-first-article
│   └── my-second-article.mdx   👈 route modules for /my-second-article
```

But this approach requires you to keep the article list page (and the `routes.ts` if you prefer) in sync manually.

```tsx
// postlist.tsx
export default function Page() {
  const articles = [
    { slug: "my-first-article", title: ...  },
    { slug: "my-second-article", title: ... },
    // 👈 you have to add new articles here.
  ]
  return (
    <>
      <h1>Blog list</h1>
      <ul>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link to={article.slug}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
};
```

Additionally, maintaining article-specific components (like comments or related articles) in this approach can become cumbersome.
Even if you extract common components to layout routes, you'll still need to include some components in each route module.
Maintaining these components scattered across article files can be challenging.

```mdx
{/* page.mdx */}
import LikeButton from "~/components/LikeButton"
import RelatedArticleCard from "~/components/RelatedArticleCard"

# My First Article

...

{/* 👇 You need to add and maintain article-specific components like these for each article. */}
<LikeButton for="my-first-article" />
<div className="flex">
  <RelatedArticleCard slug="my-serond-article" />
  <RelatedArticleCard slug="another-related-article" />
</div>
```

To address these challenges, In this example, route files dynamically load articles from a dedicated `contents` directory.
The article list page (postlist.tsx) dynamically loads the list from the directory.
Also, the routes to all article pages in the directory are always available.

```
├── contents   👈 contains article contents only
│   ├── my-first-article.mdx
│   └── my-second-article.mdx
├── routes
│   ├── post.tsx   👈 route module for "/:article-name", shared by every article. 
│   └── postlist.tsx
...
```

The loader function in `pagelist.tsx` dynamically fetches and displays all articles from the contents directory. There's no need to manually maintain the article list.

Shared components (like buttons or related links) are centralized in the `post.tsx` route module, making maintenance straightforward.

## Implementation Detail

The feature described above is achieved by reading articles from the filesystem in [server loaders](https://reactrouter.com/start/framework/data-loading#server-data-loading) and pre-render the return value of the `loader`s at build time.

The app dynamically loads articles from the `contents` directory using filesystem.
To do this, the app uses `node:fs`, which requires running the code in a Node.js environment.
To achieve this, [`loader`](https://reactrouter.com/start/framework/data-loading#server-data-loading)s (server functions to load page data) are defined in `postlist.tsx` and `post.tsx` to handle reading the directory and parsing `.mdx` files with `mdx-bundler`.

```ts
// services.server.ts
import fs from "node:fs";
import { bundleMDX } from "mdx-bundler";

...

export async function listAllArticles() {
  const dirs = fs.readdirSync(`${process.cwd()}/app/contents`);
  const articles: Article[] = await Promise.all(
    dirs.map(async (slug) => {
      const { frontmatter } = await bundlePost(slug);
      return { slug, ...frontmatter } as Article;
    }),
  );
  articles.sort((a, b) => a.writtenAt < b.writtenAt ? 1 : -1);
  return articles;
}

// routes/postlist.tsx
export async function loader() {
  return await listAllArticles();
};

export default function Page({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1>Blog list</h1>
      <ul>
        {loaderData.map((article) => (
          <li key={article.slug}>
            <Link to={article.slug}>{article.title}</Link>
          </li>
        ))}
      </ul>
    </>
  );
};
```

During the build process, React Router pre-renders all routes.
[The build process](https://reactrouter.com/how-to/pre-rendering#data-loading-and-pre-rendering) executes the defined `loader`s at build time, saving their outputs as part of the build assets.
This approach ensures that all articles present in the `contents` directory during the build are included in the resulting static website.

Note that using `node:fs` doesn't mean this example can only be deployed to node environment.
Node is required only at build time on your local machine.
You can deploy the built asset to any server runtime as they require no server.
