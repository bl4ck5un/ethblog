import { useEffect, useState } from 'react';
import { getOnePost } from './ethblog';
import { Helmet } from 'react-helmet';
import Giscus from '@giscus/react';

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

    let post_title = post.title || `Post #${index}`;

    return (
        <>
            <Helmet>
                <title>{post_title} | Hacking Decentralized</title>
                <meta property="og:title" content={post_title} />
            </Helmet>

            <div>
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><a href="/">Posts</a></li>
                        <li className="breadcrumb-item active" aria-current="page">Blog {index}</li>
                    </ol>
                </nav>
                <div className="mt-5">
                    <div className='text-center p-2'>
                        <h1 className="mb-3">📝 {post_title}</h1>

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

                <div className='mt-5'>
                    <Giscus
                        repo="bl4ck5un/ethblog"
                        repoId="R_kgDOPFS14w"
                        category="Announcements"
                        categoryId="DIC_kwDOPFS1484Cschp"
                        mapping="og:title"
                        reactionsEnabled="1"
                        emitMetadata="0"
                        inputPosition="button"
                        theme="light"
                        lang="en"
                    />
                </div>
            </div>
        </>
    );
}

export default PostView;