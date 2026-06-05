import { ActionFunctionArgs } from "react-router";
import { checkAreaConflict } from "~/lib/services";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const areaId = parseInt(formData.get("areaId") as string);
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const excludePermitId = formData.get("excludePermitId")
    ? parseInt(formData.get("excludePermitId") as string)
    : undefined;

  if (!areaId || !startDate || !endDate) {
    return Response.json(
      { hasConflict: false, conflictingPermits: [], error: "参数不完整" },
      { status: 400 }
    );
  }

  const result = await checkAreaConflict(areaId, startDate, endDate, excludePermitId);
  return Response.json(result);
};
