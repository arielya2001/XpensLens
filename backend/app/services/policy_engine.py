from app.schemas.expense import ExpenseCreateRequest


class PolicyEngineService:
    def evaluate(self, payload: ExpenseCreateRequest) -> str:
        # TODO: centralize all reimbursement policy validations.
        raise NotImplementedError
