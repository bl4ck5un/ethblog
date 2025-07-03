import { useEffect, useState } from 'react';
import { getPosts } from './ethblog';

export default function PostList() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        getPosts().then(setPosts);
    }, []);

    return (
        <div>
            <h1>Blog Posts</h1>
            <ul>
                {posts.map(p => (
                    <li key={p.id}>
                        <a href={`/?post=${p.id}`}>{p.title}</a>: <p>{p.content}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}