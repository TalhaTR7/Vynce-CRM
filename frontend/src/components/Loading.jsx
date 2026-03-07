import loading from "../assets/icons/loading.svg";

const wrapperStyle = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
};

function Loading() {
    return (
        <div style={wrapperStyle}>
            <img src={loading} style={{ width: "120px" }} />
        </div>
    );
}

export default Loading;
