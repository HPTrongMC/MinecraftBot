const mineflayer = require('mineflayer');

const bot = mineflayer.createBot({
  host: 'durian.fps.ms', // Thay đổi địa chỉ server của bạn
  port: 25913, // Thay đổi cổng server của bạn
  username: 'HPTMC', // Thay đổi tên bot của bạn
  version: '1.18.2'
});

const blockToFind = 'minecraft:end_stone'; // Thay đổi loại block bạn muốn tìm kiếm

bot.on('spawn', () => {
  console.log('Bot đã spawn thành công!');

  // Tìm kiếm block trong The End
  findAndDigBlock(blockToFind);
});

function findAndDigBlock(blockName) {
  // Lấy vị trí hiện tại của player
  const currentPosition = bot.player.position;

  // Kiểm tra xem currentPosition có được định nghĩa hay không
  if (!currentPosition) {
    console.error("Vị trí người chơi chưa được xác định!");
    return;
  }

  // Tìm kiếm block
  const blockPosition = findBlock(blockName, currentPosition);

  if (blockPosition) {
    // Kiểm tra block phía dưới block đang đứng trước khi đào
    const blockBelow = bot.world.getBlock({ x: blockPosition.x, y: blockPosition.y - 1, z: blockPosition.z });

    if (blockBelow && blockBelow.name === 'minecraft:air') {
      console.log('Block phía dưới không an toàn, không đào!');
    } else {
      // Di chuyển đến block an toàn trước khi đào
      moveToBlockSafely(blockPosition);

      // Đào block
      digBlock(blockPosition);
    }
  } else {
    console.log('Không tìm thấy block ' + blockName);
  }
}

function findBlock(blockName, startPosition) {
  // Tìm kiếm block trong phạm vi 10 block
  const searchRadius = 10;

  for (let x = startPosition.x - searchRadius; x <= startPosition.x + searchRadius; x++) {
    for (let y = startPosition.y - searchRadius; y <= startPosition.y + searchRadius; y++) {
      for (let z = startPosition.z - searchRadius; z <= startPosition.z + searchRadius; z++) {
        const block = bot.world.getBlock({ x, y, z });

        if (block && block.name === blockName) {
          return { x, y, z };
        }
      }
    }
  }

  return null;
}

function moveToBlockSafely(blockPosition) {
  // Di chuyển đến block theo đường thẳng, kiểm tra an toàn trước mỗi bước
  const path = bot.pathfinder.findPath(bot.player.position, blockPosition);

  for (let i = 0; i < path.length; i++) {
    const nextPosition = path[i];

    if (!isPositionSafe(nextPosition)) {
      // Vị trí tiếp theo không an toàn, tìm đường khác
      const newPath = bot.pathfinder.findPath(bot.player.position, blockPosition, { avoidBlocks: [nextPosition] });

      if (newPath) {
        path = newPath;
      } else {
        // Không tìm được đường an toàn, dừng di chuyển
        console.log('Không tìm được đường an toàn đến block!');
        return;
      }
    }

    bot.move.to(nextPosition);
  }
}

function digBlock(blockPosition) {
  // Đào block
  bot.blockAt.dig(blockPosition);
}

function isPositionSafe(position) {
  // Kiểm tra xem vị trí có an toàn hay không
  const blockBelow = bot.world.getBlock({ x: position.x, y: position.y - 1, z: position.z });

  if (!blockBelow || blockBelow.name === 'minecraft:air') {
    // Vị trí dưới chân không an toàn, có thể rơi vào vực
    return false;
  }

  const blockAround = bot.world.getBlocksAround({ x: position.x, y: position.y, z: position.z });

  for (const block of blockAround) {
    if (block && block.name === 'minecraft:lava') {
      // Vị trí có dung nham, không an toàn
      return false;
    }
  }

  return true;
}
