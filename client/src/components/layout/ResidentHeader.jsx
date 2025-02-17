import { Link } from 'react-router-dom';
import { FaHouseUser } from "react-icons/fa";
export default function Header({
  heading,
  paragraph,
  linkName,
  linkUrl = "#"
}) {
  return (
    <div className="mb-10">
      <div className="flex justify-center">
      <FaHouseUser className="text-8xl mb-2" /> 
      </div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-text">
        {heading}
      </h2>
      <p className="mt-2 text-center text-sm text-text">
        {paragraph} {' '}
        <Link to={linkUrl} className="font-medium text-blue1 hover:text-blue2">
          {linkName}
        </Link>
      </p>
    </div>
  );
}
