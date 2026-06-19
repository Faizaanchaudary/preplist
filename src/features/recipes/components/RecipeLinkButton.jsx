import { BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../../shared/ui/Button";
import { ROUTES } from "../../../shared/constants/routes";

export default function RecipeLinkButton({
  recipeId,
  className,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!recipeId) return null;

  return (
    <Button
      variant="secondary"
      className={className}
      onClick={() =>
        navigate(
          `${ROUTES.RECIPE_BOOK}?recipeId=${recipeId}&from=${encodeURIComponent(
            location.pathname
          )}`
        )
      }
    >
      <BookOpen className="h-4 w-4" />
      View recipe
    </Button>
  );
}