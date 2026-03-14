import CommentCard from './CommentCard';

export default function CommentThread({ comments = [], onReply }) {
    // Basic root rendering map. A recursive model would filter by parent == null recursively building trees
    // We assume backend returns flat sorted right now for this dummy phase.

    if (!comments || comments.length === 0) {
        return <div className="py-8 text-center text-brand-muted text-sm border border-white/5 border-dashed rounded-xl">No comments yet. Join the conversation.</div>
    }

    // Convert flat array to nested structure conceptually
    const rootComments = comments.filter(c => !c.parent);
    const repliesMap = {};
    comments.forEach(c => {
        if (c.parent) {
             if (!repliesMap[c.parent]) repliesMap[c.parent] = [];
             repliesMap[c.parent].push(c);
        }
    });

    const renderTree = (commentNodes, isNested = false) => {
        return commentNodes.map(comment => (
            <div key={comment._id} className={isNested ? "mt-4" : "mt-6"}>
                <CommentCard comment={comment} onReply={onReply} />
                {repliesMap[comment._id] && repliesMap[comment._id].length > 0 && (
                    <div className="pl-6 border-l-2 border-white/5 ml-3">
                        {renderTree(repliesMap[comment._id], true)}
                    </div>
                )}
            </div>
        ));
    };

    return (
        <div className="w-full flex-col">
            {renderTree(rootComments)}
        </div>
    );
}
