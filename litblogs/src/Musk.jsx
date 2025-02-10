// src/HelpPage.js
import React from "react";
const [selectedBlock, setSelectedBlock] = useState(null);

  const allPosts = [
    { id: 2, views: 150, comments: 20 },
    { id: 4, views: 200, comments: 30 },
    { id: 6, views: 180, comments: 25 },
  ];

  const topPosts = [
    { id: 1, title: "Top Post 1" },
    { id: 2, title: "Top Post 2" },
    { id: 3, title: "Top Post 3" },
  ];
const Musk = () => {
  return (
        <div className="grid grid-cols-3 gap-4 p-6">
      {/* All Posts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Posts</h2>
        {allPosts.map((post) => (
          <Card
            key={post.id}
            className="p-4 mb-2 cursor-pointer hover:bg-gray-100"
            onClick={() => setSelectedBlock(post.id)}
          >
            <CardContent>
              <p className="font-semibold">Block {post.id}</p>
              <p className="text-sm text-gray-600">Views: {post.views} | Comments: {post.comments}</p>
            </CardContent>
          </Card>
        ))}
        {selectedBlock && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold">Posts in Block {selectedBlock}</h3>
            <p>Student posts will be displayed here...</p>
            <Button className="mt-2">Join Class</Button>
          </div>
        )}
      </div>

      {/* My Posts Section */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button className="w-full text-lg font-semibold">My Posts</Button>
      </motion.div>

      {/* Top Posts Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Top Posts</h2>
        <div className="grid grid-cols-2 gap-2">
          {topPosts.map((post) => (
            <Card key={post.id} className="p-4 flex justify-center items-center h-24">
              <CardContent>
                <p className="text-center font-semibold">{post.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Musk;