#database standalone Dockerfile

# Use the official PostgreSQL image
FROM postgres:15

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=your_user
ENV POSTGRES_PASSWORD=your_password
ENV POSTGRES_DB=dht_nodes

# Copy the initialization script into the container
COPY ./init.sql /docker-entrypoint-initdb.d/

# Expose the default PostgreSQL port
EXPOSE 5432
