export class AppError
  extends Error
{
  readonly statusCode: number;
  readonly code: string;
  readonly publicMessage: string;

  constructor(
    statusCode: number,
    code: string,
    publicMessage: string,
  ) {
    super(publicMessage);

    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.publicMessage = publicMessage;
  }
}
