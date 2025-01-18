import { listAllArticles } from "~/services.server";
import type { Route } from "./+types/postlist";
import { Link } from "react-router";

export async function loader() {
  // list all articles at server code to avoid all contents being sent to the client
  return await listAllArticles();
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog list" },
    { name: "description", content: "my blog list" },
  ];
}

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
