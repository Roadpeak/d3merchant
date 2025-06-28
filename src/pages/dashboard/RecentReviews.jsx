import React from 'react';

const RecentReviews = () => {
    const reviews = [
        { id: 1, reviewer: 'John Doe', rating: 5, comment: 'Excellent service!', type: 'positive' },
        { id: 2, reviewer: 'Jane Smith', rating: 4, comment: 'Great experience overall.', type: 'positive' },
        { id: 3, reviewer: 'Mike Johnson', rating: 3, comment: 'Good, but could be better.', type: 'neutral' },
        { id: 4, reviewer: 'Emily Brown', rating: 2, comment: 'Not satisfied with the service.', type: 'negative' },
        { id: 5, reviewer: 'Chris Lee', rating: 1, comment: 'Terrible experience!', type: 'negative' },
    ];

    const typeStyles = {
        positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        neutral: 'text-slate-700 bg-slate-50 border-slate-200',
        negative: 'text-rose-700 bg-rose-50 border-rose-200',
    };

    const renderStars = (rating) => (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <svg
                    key={i}
                    className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-current' : 'text-gray-300'
                        }`}
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="ml-1 text-xs font-medium text-gray-600">{rating}/5</span>
        </div>
    );

    return (
        <div className="w-full md:w-[30%] border p-6 rounded-xl border-gray-200 bg-white shadow-sm backdrop-blur-sm">
            <h2 className="mb-6 text-primary text-[18px] font-semibold border-b pb-3 border-gray-100">
                Recent Reviews
            </h2>
            <div className="flex flex-col gap-3 w-full">
                {reviews.map((review) => (
                    <article
                        key={review.id}
                        className={`flex flex-col p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${typeStyles[review.type] || 'text-gray-700 bg-gray-50 border-gray-200'
                            }`}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="text-[15px] font-medium">{review.reviewer}</h3>
                            {renderStars(review.rating)}
                        </div>
                        <p className="mt-1 text-[14px]">{review.comment}</p>
                    </article>
                ))}
            </div>
        </div>
    );
};

export default RecentReviews;