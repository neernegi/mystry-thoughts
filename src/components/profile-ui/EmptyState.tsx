export const EmptyState = ({
  message,
  subMessage,
}: {
  message: string;
  subMessage: string;
}) => (
  <div className="text-center py-16">
    <div className="text-gray-400 text-xl mb-4">{message}</div>
    {subMessage && <p className="text-gray-500">{subMessage}</p>}
  </div>
);
