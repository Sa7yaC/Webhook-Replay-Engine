// TotalWebhooks.jsx

const TotalWebhooks = ({
  webhooks,
  value = 0,
  percentage = "+21.2%",
  title = "Total Webhooks",
}) => {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>{title}</h2>

        <div style={styles.percentage}>
          {percentage}
        </div>
      </div>

      <div style={styles.value}>
        {webhooks ?? value}
      </div>
    </div>
  );
};

const styles = {
  card: {
    width: "100%",
    maxWidth: "570px",
    height: "345px",
    backgroundColor: "#ffffff",
    borderRadius: "25px",
    padding: "40px 30px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  title: {
    margin: 0,
    fontSize: "45px",
    lineHeight: 1,
    fontWeight: 550,
    letterSpacing: "-1px",
    fontFamily: "'League Gothic', sans-serif",
    color: "#050505",
  },

  percentage: {
    backgroundColor: "#b6f7c5",
    borderRadius: "22px",
    padding: "16px 28px",
    fontSize: "27px",
    lineHeight: 1,
    fontFamily: "'Bruno Ace', sans-serif",
    fontWeight: 500,
    color: "#050505",
    whiteSpace: "nowrap",
  },

  value: {
    fontSize: "138px",
    lineHeight: 0.8,
    fontWeight: 400,
    letterSpacing: "-5px",
    fontFamily: "'Bruno Ace', sans-serif",
    color: "#1238f5",
    marginBottom: "10px",
  },
};

export default TotalWebhooks;