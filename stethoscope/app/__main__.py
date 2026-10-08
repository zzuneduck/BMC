"""실행: python -m app [serve|run-now|dispatch-now]"""
import argparse
import logging
import os


def main() -> None:
    ap = argparse.ArgumentParser(prog="stethoscope", description="너만을 위한 청진기")
    ap.add_argument("command", nargs="?", default="serve", choices=["serve", "run-now", "dispatch-now"])
    ap.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")))
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if args.command == "run-now":
        from .pipeline import run_collection

        run_collection(kind="manual", trigger="cli")
    elif args.command == "dispatch-now":
        from .report import run_weekly_dispatch

        for r in run_weekly_dispatch(trigger="cli"):
            print(r)
    else:
        import uvicorn

        print(f"\n  🩺 너만을 위한 청진기 → http://localhost:{args.port}\n")
        uvicorn.run("app.web:app", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
