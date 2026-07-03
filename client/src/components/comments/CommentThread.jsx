import CommentCard from './CommentCard';

export default function CommentThread({ comments = [], postId, onReply, onSubmitSuccess }) {
    if (!comments || comments.length === 0) {
        return null; // The parent page will render a beautiful premium empty placeholder state
    }

    // Convert flat array to nested tree structure dynamically
    const rootComments = comments.filter(c => !c.parent);
    const repliesMap = {};
    comments.forEach(c => {
        if (c.parent) {
             const pId = typeof c.parent === 'object' ? c.parent._id : c.parent;
             if (!repliesMap[pId]) repliesMap[pId] = [];
             repliesMap[pId].push(c);
        }
    });

    const renderTree = (commentNodes, isNested = false) => {
        return commentNodes.map(comment => (
            <div key={comment._id} className={isNested ? "mt-3" : "mt-5"}>
                <CommentCard 
                    comment={comment} 
                    postId={postId}
                    onReply={onReply} 
                    onSubmitSuccess={onSubmitSuccess}
                />
                {repliesMap[comment._id] && repliesMap[comment._id].length > 0 && (
                    <div className="pl-5 border-l border-[var(--border-color)] ml-4 mt-2">
                        {renderTree(repliesMap[comment._id], true)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="w-full flex flex-col">
            {renderTree(rootComments)}
        </div>
    );
}
