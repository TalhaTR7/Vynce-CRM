import loading from "../assets/icons/loading.svg";

const wrapperStyle = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
};

const imgStyle = {
    width: "120px"
};

function Loading() {
    return (
        <div style={wrapperStyle}>
            <img src={loading} style={imgStyle} />
        </div>
    );
}

export default Loading;
