

// Import SVG assets
import bp from '../assets/iconchess/Piece=Pawn, Side=Black.svg';
import wp from '../assets/iconchess/Piece=Pawn, Side=White.svg';
import bn from '../assets/iconchess/Piece=Knight, Side=Black.svg';
import wn from '../assets/iconchess/Piece=Knight, Side=White.svg';
import bb from '../assets/iconchess/Piece=Bishop, Side=Black.svg';
import wb from '../assets/iconchess/Piece=Bishop, Side=White.svg';
import br from '../assets/iconchess/Piece=Rook, Side=Black.svg';
import wr from '../assets/iconchess/Piece=Rook, Side=White.svg';
import bq from '../assets/iconchess/Piece=Queen, Side=Black.svg';
import wq from '../assets/iconchess/Piece=Queen, Side=White.svg';
import bk from '../assets/iconchess/Piece=King, Side=Black.svg';
import wk from '../assets/iconchess/Piece=King, Side=White.svg';

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type PieceColor = 'w' | 'b';

interface ChessPieceProps {
    type: PieceType;
    color: PieceColor;
    className?: string;
}

const pieceMap: Record<string, string> = {
    'bp': bp, 'wp': wp,
    'bn': bn, 'wn': wn,
    'bb': bb, 'wb': wb,
    'br': br, 'wr': wr,
    'bq': bq, 'wq': wq,
    'bk': bk, 'wk': wk,
};

const ChessPiece = ({ type, color, className = '' }: ChessPieceProps) => {
    const key = `${color}${type}`;
    const src = pieceMap[key];

    return (
        <img
            src={src}
            alt={`${color} ${type}`}
            className={`w-full h-full drop-shadow-lg select-none pointer-events-none ${className}`}
            style={{
                filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.4))',
                // @ts-ignore
                WebkitUserDrag: 'none',
                userSelect: 'none',
            }}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
        />
    );
};

export default ChessPiece;
