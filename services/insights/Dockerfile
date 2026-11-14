FROM python:3.12-slim
WORKDIR /app
COPY services/insights/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/insights/ .
USER 65534:65534
EXPOSE 8001
CMD ["uvicorn","main:app","--host","0.0.0.0","--port","8001"]
