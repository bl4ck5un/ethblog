import { useEffect, useState } from 'react';
import { getPosts } from './ethblog';

function extractDigest(html, maxLength = 500) {
    // Strip tags
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText || "";

    // Trim and truncate
    const trimmed = text.trim().replace(/\s+/g, " ");
    return trimmed.length > maxLength
        ? trimmed.slice(0, maxLength).trim() + "..."
        : trimmed;
}

export default function PostList() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        getPosts().then(setPosts);
    }, []);

    return (
        <div className="container my-5">
            <h1 className="text-center mb-4">📰 Recent Posts</h1>
            <div className="row row-cols-1 row-cols-md-2 g-4">
                {posts.map((p) => (
                    <div key={p.id} className="col">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">
                                    📝 <a href={`/?post=${p.id}`} className="text-decoration-none">{p.title || `Post #${p.id}`}</a>
                                </h5>
                                <p className="card-subtitle text-muted mb-2">
                                    {p.author && <>✍️ {p.author}</>}
                                    {p.date && (
                                        <> · 📅 {new Date(p.date).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}</>
                                    )}
                                </p>
                                <p className="card-text small flex-grow-1">{extractDigest(p.content)}</p>
                                <a href={`/?post=${p.id}`} className="btn btn-outline-primary mt-auto align-self-start">Read on →</a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}