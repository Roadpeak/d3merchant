import React from 'react';

const RecentReviews = () => {
    const reviews = [
        { id: 1, reviewer: 'John Doe', rating: 5, comment: 'Excellent service!', type: 'positive' },
        { id: 2, reviewer: 'Jane Smith', rating: 4, comment: 'Great experience overall.', type: 'positive' },
        { id: 3, reviewer: 'Mike Johnson', rating: 3, comment: 'Good, but could be better.', type: 'neutral' },
        { id: 4, reviewer: 'Emily Brown', rating: 2, comment: 'Not satisfied with the service.', type: 'negative' },
        { id: 5, reviewer: 'Chris Lee', rating: 1, comment: 'Terrible experience!', type: 'negative' },
    ];

    const getTypeStyle = (type) => {
        switch (type) {
            case 'positive':
                return 'text-green-600 bg-green-50';
            case 'neutral':
                return 'text-yellow-600 bg-yellow-50';
            case 'negative':
                return 'text-red-600 bg-red-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="w-full md:w-[30%] border p-4 rounded-lg border-gray-200 bg-white">
            <p className="mb-4 text-primary text-[18px] font-medium border-b pb-2">Recent Reviews</p>
            <div className="flex flex-col gap-3 w-full">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className={`flex flex-col p-3 rounded-md ${getTypeStyle(review.type)}`}
                    >
                        <div className="flex justify-between items-center">
                            <p className="text-[15px] font-medium">{review.reviewer}</p>
                            <p className="text-[14px] font-semibold">{'⭐'.repeat(review.rating)}</p>
                        </div>
                        <p className="mt-1 text-[14px]">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentReviews;
