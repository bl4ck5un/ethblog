import { useEffect, useState } from 'react';
import { getOnePost } from './ethblog';

function PostView({ index }) {
    const [post, setPost] = useState(null);

    useEffect(() => {
        const loadPost = async () => {
            const result = await getOnePost(index);
            setPost(result);
        };
        loadPost();
    }, [index]);

    if (!post) return <p>Loading post...</p>;

    return (
        <div>
            <a href="/">← Back</a>
            <h1>Blog {index}</h1>
            <p dangerouslySetInnerHTML={{ __html: post }} />
        </div>
    );
}

export default PostView;