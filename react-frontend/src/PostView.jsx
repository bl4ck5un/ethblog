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
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/">Posts</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Blog {index}</li>
                </ol>
            </nav>
            <div className="mt-5">
                <div className='text-center p-2'>
                    <h1 className="mb-3">📝 {post.title || `Post #${index}`}</h1>

                    {(post.author || post.date) && (
                        <p className="text-muted mb-4">
                            {post.author && <span>👤 <strong>{post.author}</strong></span>}
                            {post.author && post.date && <span className="mx-2">•</span>}
                            {post.date && <span>📅 {new Date(post.date).toLocaleDateString()}</span>}
                        </p>
                    )}
                </div>

                <div className="post-content mt-4 p-4 border rounded shadow-sm bg-light" dangerouslySetInnerHTML={{ __html: post.content }} />
            </div>
        </div>
    );
}

export default PostView;